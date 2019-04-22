// export type SvgDragSelectElement = ReturnType<SVGSVGElement["getIntersectionList"]> extends NodeListOf<infer T> ? T : never
export type SvgDragSelectElement = SVGCircleElement | SVGEllipseElement | SVGImageElement | SVGLineElement | SVGPathElement | SVGPolygonElement | SVGPolylineElement | SVGRectElement | SVGTextElement | SVGUseElement

export interface SvgDragSelectEvent {
  readonly svg: SVGSVGElement
  readonly pointerEvent: PointerEvent
  readonly selectedElements: readonly SvgDragSelectElement[]
  readonly previousSelectedElements: readonly SvgDragSelectElement[]
  readonly dragStartClientX: number
  readonly dragStartClientY: number
  readonly currentClientX: number
  readonly currentClientY: number
}

export interface SvgDragSelectOptions {
  readonly svg: SVGSVGElement
  readonly onSelect: (event: SvgDragSelectEvent) => any
  readonly intersection?: boolean
}

export default (options: SvgDragSelectOptions) => {
  const svg = options.svg
  let dragStartPoint: DOMPointReadOnly | undefined
  let selectedElements: SvgDragSelectElement[] = []
  const dragAreaIndicator = document.createElement('div')
  const dragAreaIndicatorStyle = dragAreaIndicator.style
  dragAreaIndicator.className = 'svg-drag-select-area'
  dragAreaIndicatorStyle.position = 'fixed'
  dragAreaIndicatorStyle.pointerEvents = 'none'

  const onPointerMove = function (this: SVGSVGElement, event: PointerEvent) {
    if (dragStartPoint !== undefined) {
      const currentClientX = event.clientX
      const currentClientY = event.clientY
      dragAreaIndicatorStyle.left = Math.min(dragStartPoint.x, currentClientX) + 'px'
      dragAreaIndicatorStyle.top = Math.min(dragStartPoint.y, currentClientY) + 'px'
      dragAreaIndicatorStyle.width = Math.abs(dragStartPoint.x - currentClientX) + 'px'
      dragAreaIndicatorStyle.height = Math.abs(dragStartPoint.y - currentClientY) + 'px'

      const transformMatrix = this.getCTM()!.multiply(this.getScreenCTM()!.inverse())
      const { x: x1, y: y1 } = dragStartPoint.matrixTransform(transformMatrix)
      const { x: x2, y: y2 } = DOMPointReadOnly
        .fromPoint({ x: currentClientX, y: currentClientY })
        .matrixTransform(transformMatrix)
      const rect = this.createSVGRect()
      rect.x = Math.min(x1, x2)
      rect.y = Math.min(y1, y2)
      rect.width = Math.abs(x1 - x2)
      rect.height = Math.abs(y1 - y2)
      const newSelectedElements = Array.prototype.slice.apply(
        options.intersection
        ? this.getIntersectionList(rect, null!)
        : this.getEnclosureList(rect, null!)
      )
      if (
        selectedElements.length !== newSelectedElements.length ||
        selectedElements.some(element => newSelectedElements.indexOf(element) === -1)
      ) {
        const previousSelectedElements = selectedElements
        selectedElements = newSelectedElements
        options.onSelect({
          svg: this,
          pointerEvent: event,
          selectedElements,
          previousSelectedElements,
          dragStartClientX: dragStartPoint.x,
          dragStartClientY: dragStartPoint.y,
          currentClientX,
          currentClientY,
        })
      }
    }
  }

  const onPointerDown = function (this: SVGSVGElement, event: PointerEvent) {
    if (event.button === 0) {
      const { clientX: x, clientY: y } = event
      dragStartPoint = DOMPointReadOnly.fromPoint({ x, y })
      document.body.appendChild(dragAreaIndicator)
      this.setPointerCapture(event.pointerId)
      onPointerMove.call(this, event)
    }
  }

  const onPointerUp = function (this: SVGSVGElement, event: PointerEvent) {
    this.releasePointerCapture(event.pointerId)
    if (dragAreaIndicator.parentElement) {
      dragAreaIndicator.parentElement.removeChild(dragAreaIndicator)
    }
    dragStartPoint = undefined
  }

  svg.addEventListener('pointerdown', onPointerDown)
  svg.addEventListener('pointermove', onPointerMove)
  svg.addEventListener('pointerup', onPointerUp)

  return {
    cancel: () => {
      svg.removeEventListener('pointerdown', onPointerDown)
      svg.removeEventListener('pointermove', onPointerMove)
      svg.removeEventListener('pointerup', onPointerUp)
    }
  }
}
