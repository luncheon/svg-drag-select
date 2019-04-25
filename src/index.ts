// export type SvgDragSelectElement = ReturnType<SVGSVGElement["getIntersectionList"]> extends NodeListOf<infer T> ? T : never
export type SvgDragSelectElement = SVGCircleElement | SVGEllipseElement | SVGImageElement | SVGLineElement | SVGPathElement | SVGPolygonElement | SVGPolylineElement | SVGRectElement | SVGTextElement | SVGUseElement

export interface SvgDragSelectionStart {
  readonly svg: SVGSVGElement
  readonly pointerEvent: PointerEvent
  cancel(): void
}

export interface SvgDragSelectionEnd {
  readonly svg: SVGSVGElement
  readonly pointerEvent: PointerEvent
  readonly clientRect: DOMRectReadOnly
  readonly svgRect: SVGRect
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

const calculateSvgRect = (svg: SVGSVGElement, clientRect: DOMRect) => {
  const ctm = svg.getCTM()
  const inverseClientCtm = svg.getScreenCTM()!.inverse()
  const transformMatrix = ctm ? ctm.multiply(inverseClientCtm) : inverseClientCtm
  const point = svg.createSVGPoint()
  point.x = clientRect.left
  point.y = clientRect.top
  const { x: x1, y: y1 } = point.matrixTransform(transformMatrix)
  point.x += clientRect.width
  point.y += clientRect.height
  const { x: x2, y: y2 } = point.matrixTransform(transformMatrix)
  const svgRect = svg.createSVGRect()
  svgRect.x = Math.min(x1, x2)
  svgRect.y = Math.min(y1, y2)
  svgRect.width = Math.abs(x1 - x2)
  svgRect.height = Math.abs(y1 - y2)
  return svgRect
}

export default (options: SvgDragSelectOptions) => {
  let pointerId: number | undefined
  let dragStartClientX: number | undefined
  let dragStartClientY: number | undefined
  let dragStartScrollX: number | undefined
  let dragStartScrollY: number | undefined
  const calculateClientRect = (event: PointerEvent) => {
    const x1 = dragStartClientX! + dragStartScrollX! - document.documentElement.scrollLeft - document.body.scrollLeft
    const y1 = dragStartClientY! + dragStartScrollY! - document.documentElement.scrollTop - document.body.scrollTop
    const x2 = event.clientX
    const y2 = event.clientY
    return new DOMRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x1 - x2), Math.abs(y1 - y2))
  }
  let selectedElements: SvgDragSelectElement[] = []
  const dragAreaOverlay = document.body.appendChild(document.createElement('div'))
  const dragAreaOverlayStyle = dragAreaOverlay.style
  dragAreaOverlay.className = 'svg-drag-select-area-overlay'
  dragAreaOverlayStyle.position = 'fixed'
  dragAreaOverlayStyle.pointerEvents = 'none'

  const onPointerMove = function (this: SVGSVGElement, event: PointerEvent) {
    if (event.pointerId === pointerId) {
      if (event.type === 'pointermove' && event.pointerType === 'touch') {
        event.preventDefault()
      }
      const clientRect = calculateClientRect(event)
      const svgRect = calculateSvgRect(this, clientRect)
      const referenceElement = options.referenceElement || null
      const newSelectedElements = Array.prototype.slice.apply(
        options.intersection
        ? this.getIntersectionList(svgRect, referenceElement!)
        : this.getEnclosureList(svgRect, referenceElement!)
      )
      dragAreaOverlayStyle.left = clientRect.x + 'px'
      dragAreaOverlayStyle.top = clientRect.y + 'px'
      dragAreaOverlayStyle.width = clientRect.width + 'px'
      dragAreaOverlayStyle.height = clientRect.height + 'px'
      if (
        selectedElements.length !== newSelectedElements.length ||
        selectedElements.some(element => newSelectedElements.indexOf(element) === -1)
      ) {
        const previousSelectedElements = selectedElements
        selectedElements = newSelectedElements
        options.onSelectionChange && options.onSelectionChange({
          svg: this,
          pointerEvent: event,
          clientRect,
          svgRect,
          selectedElements,
          previousSelectedElements,
        })
      }
    }
  }

  const onPointerDown = function (this: SVGSVGElement, event: PointerEvent) {
    if (event.isPrimary && pointerId === undefined) {
      let canceled: boolean | undefined
      options.onSelectionStart && options.onSelectionStart({
        svg: this,
        pointerEvent: event,
        cancel: () => canceled = true,
      })
      if (!canceled) {
        pointerId = event.pointerId
        dragStartClientX = event.clientX
        dragStartClientY = event.clientY
        dragStartScrollX = document.documentElement.scrollLeft + document.body.scrollLeft
        dragStartScrollY = document.documentElement.scrollTop + document.body.scrollTop
        onPointerMove.call(this, event)
        dragAreaOverlayStyle.display = ''
        this.addEventListener('pointermove', onPointerMove, event.pointerType === 'touch' ? nonPassive : undefined)
        this.setPointerCapture(pointerId)
      }
    }
  }

  const onPointerUp = function (this: SVGSVGElement, event: PointerEvent) {
    if (event.pointerId === pointerId) {
      this.releasePointerCapture(pointerId)
      this.removeEventListener('pointermove', onPointerMove)
      pointerId = undefined
      dragAreaOverlayStyle.display = 'none'
      const clientRect = calculateClientRect(event)
      const svgRect = calculateSvgRect(this, clientRect)
      options.onSelectionEnd && options.onSelectionEnd({
        svg: this,
        pointerEvent: event,
        clientRect,
        svgRect,
        selectedElements,
      })
    }
  }

  const svg = options.svg
  const originalDraggable = svg.getAttribute('draggable')
  const originalPointerEvents = svg.style.pointerEvents
  const originalTouchAction = svg.style.touchAction
  svg.style.pointerEvents = 'all'
  svg.style.touchAction = 'pinch-zoom'
  svg.setAttribute('draggable', 'false')
  svg.addEventListener('pointerdown', onPointerDown)
  svg.addEventListener('pointerup', onPointerUp)
  svg.addEventListener('pointercancel', onPointerUp)

  return {
    dragAreaOverlay,
    cancel: () => {
      if (originalDraggable === null) {
        svg.removeAttribute('draggable')
      } else {
        svg.setAttribute('draggable', originalDraggable)
      }
      svg.style.pointerEvents = originalPointerEvents
      svg.style.touchAction = originalTouchAction
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
