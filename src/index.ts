// export type SvgDragSelectElement = ReturnType<SVGSVGElement["getIntersectionList"]> extends NodeListOf<infer T> ? T : never
export type SvgDragSelectElement = SVGCircleElement | SVGEllipseElement | SVGImageElement | SVGLineElement | SVGPathElement | SVGPolygonElement | SVGPolylineElement | SVGRectElement | SVGTextElement | SVGUseElement

export interface SvgDragSelectionStart {
  readonly svg: SVGSVGElement
  readonly pointerEvent: PointerEvent
  readonly dragStartClientX: number
  readonly dragStartClientY: number
  readonly currentClientX: number
  readonly currentClientY: number
  cancel(): void
}

export interface SvgDragSelectionEnd {
  readonly svg: SVGSVGElement
  readonly pointerEvent: PointerEvent
  readonly dragStartClientX: number
  readonly dragStartClientY: number
  readonly currentClientX: number
  readonly currentClientY: number
  readonly selectedElements: ReadonlyArray<SvgDragSelectElement>
}

export interface SvgDragSelectionChange extends SvgDragSelectionEnd {
  readonly previousSelectedElements: ReadonlyArray<SvgDragSelectElement>
}

export interface SvgDragSelectOptions {
  readonly svg: SVGSVGElement
  readonly referenceElement?: SVGElement
  readonly onSelectionStart?: (event: SvgDragSelectionStart) => any
  readonly onSelectionChange?: (event: SvgDragSelectionChange) => any
  readonly onSelectionEnd?: (event: SvgDragSelectionEnd) => any
  readonly intersection?: boolean
}

let nonPassive: { passive: false } | undefined
try {
  const options = Object.defineProperty({}, 'passive', {
    get() {
      nonPassive = { passive: false }
    }
  })
  const noop = () => {}
  addEventListener('t', noop, options);
  removeEventListener('t', noop, options);
} catch(err) {}


export default (options: SvgDragSelectOptions) => {
  const svg = options.svg
  let pointerId: number | undefined
  let dragStartPoint: SVGPoint | undefined
  let selectedElements: SvgDragSelectElement[] = []
  const dragAreaOverlay = document.body.appendChild(document.createElement('div'))
  const dragAreaOverlayStyle = dragAreaOverlay.style
  dragAreaOverlay.className = 'svg-drag-select-area-overlay'
  dragAreaOverlayStyle.position = 'fixed'
  dragAreaOverlayStyle.pointerEvents = 'none'

  const onPointerMove = function (this: SVGSVGElement, event: PointerEvent) {
    if (dragStartPoint && event.pointerId === pointerId) {
      if (event.type === 'pointermove' && event.pointerType === 'touch') {
        event.preventDefault()
      }
      const currentClientX = event.clientX
      const currentClientY = event.clientY
      dragAreaOverlayStyle.left = Math.min(dragStartPoint.x, currentClientX) + 'px'
      dragAreaOverlayStyle.top = Math.min(dragStartPoint.y, currentClientY) + 'px'
      dragAreaOverlayStyle.width = Math.abs(dragStartPoint.x - currentClientX) + 'px'
      dragAreaOverlayStyle.height = Math.abs(dragStartPoint.y - currentClientY) + 'px'

      const ctm = this.getCTM()
      const inverseClientCtm = this.getScreenCTM()!.inverse()
      const transformMatrix = ctm ? ctm.multiply(inverseClientCtm) : inverseClientCtm
      const { x: x1, y: y1 } = dragStartPoint.matrixTransform(transformMatrix)
      const currentPoint = this.createSVGPoint()
      currentPoint.x = currentClientX
      currentPoint.y = currentClientY
      const { x: x2, y: y2 } = currentPoint.matrixTransform(transformMatrix)
      const rect = this.createSVGRect()
      rect.x = Math.min(x1, x2)
      rect.y = Math.min(y1, y2)
      rect.width = Math.abs(x1 - x2)
      rect.height = Math.abs(y1 - y2)
      const referenceElement = options.referenceElement || null
      const newSelectedElements = Array.prototype.slice.apply(
        options.intersection
        ? this.getIntersectionList(rect, referenceElement!)
        : this.getEnclosureList(rect, referenceElement!)
      )
      if (
        selectedElements.length !== newSelectedElements.length ||
        selectedElements.some(element => newSelectedElements.indexOf(element) === -1)
      ) {
        const previousSelectedElements = selectedElements
        selectedElements = newSelectedElements
        options.onSelectionChange && options.onSelectionChange({
          svg: this,
          pointerEvent: event,
          dragStartClientX: dragStartPoint.x,
          dragStartClientY: dragStartPoint.y,
          currentClientX,
          currentClientY,
          selectedElements,
          previousSelectedElements,
        })
      }
    }
  }

  const onPointerDown = function (this: SVGSVGElement, event: PointerEvent) {
    if (event.isPrimary && pointerId === undefined) {
      const { clientX: x, clientY: y } = event
      let canceled: any
      options.onSelectionStart && options.onSelectionStart({
        svg: this,
        pointerEvent: event,
        dragStartClientX: x,
        dragStartClientY: y,
        currentClientX: x,
        currentClientY: y,
        cancel: () => canceled = true,
      })
      if (canceled) {
        return
      }
      pointerId = event.pointerId
      dragStartPoint = this.createSVGPoint()
      dragStartPoint.x = x
      dragStartPoint.y = y
      onPointerMove.call(this, event)
      dragAreaOverlayStyle.display = ''
      this.addEventListener('pointermove', onPointerMove, event.pointerType === 'touch' ? nonPassive : undefined)
      this.setPointerCapture(event.pointerId)
    }
  }

  const onPointerUp = function (this: SVGSVGElement, event: PointerEvent) {
    if (event.pointerId === pointerId) {
      this.releasePointerCapture(pointerId)
      this.removeEventListener('pointermove', onPointerMove)
      pointerId = undefined
      dragAreaOverlayStyle.display = 'none'
      if (dragStartPoint) {
        const _dragStartPoint = dragStartPoint
        dragStartPoint = undefined
        options.onSelectionEnd && options.onSelectionEnd({
          svg: this,
          pointerEvent: event,
          dragStartClientX: _dragStartPoint.x,
          dragStartClientY: _dragStartPoint.y,
          currentClientX: event.clientX,
          currentClientY: event.clientY,
          selectedElements,
        })
      }
    }
  }

  svg.addEventListener('pointerdown', onPointerDown)
  svg.addEventListener('pointerup', onPointerUp)
  svg.addEventListener('pointercancel', onPointerUp)

  return {
    dragAreaOverlay,
    cancel: () => {
      svg.removeEventListener('pointerdown', onPointerDown)
      svg.removeEventListener('pointerup', onPointerUp)
      svg.removeEventListener('pointermove', onPointerMove)
      svg.removeEventListener('pointercancel', onPointerUp)
      if (dragAreaOverlay.parentElement) {
        dragAreaOverlay.parentElement.removeChild(dragAreaOverlay)
      }
    }
  }
}
