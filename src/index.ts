// export type SvgDragSelectElement = ReturnType<SVGSVGElement["getIntersectionList"]> extends NodeListOf<infer T> ? T : never
export type SvgDragSelectElement = SVGCircleElement | SVGEllipseElement | SVGImageElement | SVGLineElement | SVGPathElement | SVGPolygonElement | SVGPolylineElement | SVGRectElement | SVGTextElement | SVGUseElement
const svgDragSelectElementTypes = [SVGCircleElement, SVGEllipseElement, SVGImageElement, SVGLineElement, SVGPathElement, SVGPolygonElement, SVGPolylineElement, SVGRectElement, SVGTextElement, SVGUseElement]

export interface SvgDragSelectionStart {
  readonly svg: SVGSVGElement
  readonly referenceElement: SVGElement | null
  readonly pointerEvent: PointerEvent
  cancel(): void
}

export interface SvgDragSelectSelectorContext {
  readonly svg: SVGSVGElement
  readonly referenceElement: SVGElement | null
  readonly pointerEvent: PointerEvent
  readonly dragAreaInClientCoordinate: DOMRect
  readonly dragAreaInSvgCoordinate: SVGRect
  readonly dragAreaInInitialSvgCoordinate: SVGRect
  getEnclosures(): SvgDragSelectElement[]
  getIntersections(): SvgDragSelectElement[]
}

export interface SvgDragSelectSelector<T = SvgDragSelectElement> {
  (context: SvgDragSelectSelectorContext): ReadonlyArray<SvgDragSelectElement>
}

export interface SvgDragSelectionEnd {
  readonly svg: SVGSVGElement
  readonly referenceElement: SVGElement | null
  readonly pointerEvent: PointerEvent
  readonly dragAreaInClientCoordinate: DOMRect
  readonly dragAreaInSvgCoordinate: SVGRect
  readonly dragAreaInInitialSvgCoordinate: SVGRect
  readonly selectedElements: ReadonlyArray<SvgDragSelectElement>
}

export interface SvgDragSelectionChange extends SvgDragSelectionEnd {
  readonly previousSelectedElements: ReadonlyArray<SvgDragSelectElement>
}

export interface SvgDragSelectOptions<T = SvgDragSelectElement> {
  readonly svg: SVGSVGElement
  readonly referenceElement?: SVGElement
  readonly onSelectionStart?: (event: SvgDragSelectionStart) => any
  readonly onSelectionChange?: (event: SvgDragSelectionChange) => any
  readonly onSelectionEnd?: (event: SvgDragSelectionEnd) => any
  readonly selector?: 'intersection' | 'enclosure' | SvgDragSelectSelector<T>
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

const createTransformedSvgRect = (svg: SVGSVGElement, matrix: DOMMatrix, x: number, y: number, width: number, height: number) => {
  const point = svg.createSVGPoint()
  point.x = x
  point.y = y
  const { x: x1, y: y1 } = point.matrixTransform(matrix)
  point.x += width
  point.y += height
  const { x: x2, y: y2 } = point.matrixTransform(matrix)
  const svgRect = svg.createSVGRect()
  svgRect.x = Math.min(x1, x2)
  svgRect.y = Math.min(y1, y2)
  svgRect.width = Math.abs(x1 - x2)
  svgRect.height = Math.abs(y1 - y2)
  return svgRect
}

const clientRectToSvgRect = (svg: SVGSVGElement, clientRect: DOMRect) =>
  createTransformedSvgRect(svg, svg.getScreenCTM()!.inverse(), clientRect.left, clientRect.top, clientRect.width, clientRect.height)

const svgRectToInitialSvgRect = (svg: SVGSVGElement, svgRect: SVGRect) => {
  const ctm = svg.getCTM()
  return ctm ? createTransformedSvgRect(svg, ctm, svgRect.x, svgRect.y, svgRect.width, svgRect.height) : svgRect
}

const _collectElements = (into: SvgDragSelectElement[], svg: SVGSVGElement, ancestor: SVGElement, filter: (element: SvgDragSelectElement) => boolean) => {
  for (let element = ancestor.firstElementChild; element; element = element.nextElementSibling) {
    if (element instanceof SVGGElement) {
      _collectElements(into, svg, element, filter)
      continue
    }
    for (const elementType of svgDragSelectElementTypes) {
      if (element instanceof elementType && filter(element)) {
        into.push(element)
      }
    }
  }
}
const collectElements = (svg: SVGSVGElement, referenceElement: SVGElement | null, filter: (element: SvgDragSelectElement) => boolean) => {
  const selected: SvgDragSelectElement[] = []
  _collectElements(selected, svg, referenceElement || svg, filter)
  return selected
}
const inRange = (x: number, min: number, max: number) => (min <= x && x <= max)
const enclosures = (areaInSvgCoordinate: SVGRect, bbox: SVGRect) => {
  const left = areaInSvgCoordinate.x
  const right = left + areaInSvgCoordinate.width
  const top = areaInSvgCoordinate.y
  const bottom = top + areaInSvgCoordinate.height
  return (
    inRange(bbox.x, left, right) && inRange(bbox.x + bbox.width, left, right) &&
    inRange(bbox.y, top, bottom) && inRange(bbox.y + bbox.height, top, bottom)
  )
}
const intersects = (areaInSvgCoordinate: SVGRect, bbox: SVGRect) => {
  const left = areaInSvgCoordinate.x
  const right = left + areaInSvgCoordinate.width
  const top = areaInSvgCoordinate.y
  const bottom = top + areaInSvgCoordinate.height
  return (
    (inRange(bbox.x, left, right) || inRange(bbox.x + bbox.width, left, right) || inRange(left, bbox.x, bbox.x + bbox.width)) &&
    (inRange(bbox.y, top, bottom) || inRange(bbox.y + bbox.height, top, bottom) || inRange(top, bbox.y, bbox.y + bbox.height))
  )
}
const enclosureListGetter: (svg: SVGSVGElement, referenceElement: SVGElement | null, dragAreaInSvgCoordinate: SVGRect, dragAreaInInitialSvgCoordinate: SVGRect) => () => SvgDragSelectElement[] =
  SVGSVGElement.prototype.getEnclosureList
  ? (svg, referenceElement, _, dragAreaInInitialSvgCoordinate) => () => Array.prototype.slice.call(svg.getEnclosureList(dragAreaInInitialSvgCoordinate, referenceElement!))
  : (svg, referenceElement, dragAreaInSvgCoordinate) => () => collectElements(svg, referenceElement, element => enclosures(dragAreaInSvgCoordinate, element.getBBox()))
const intersectionListGetter: (svg: SVGSVGElement, referenceElement: SVGElement | null, dragAreaInSvgCoordinate: SVGRect, dragAreaInInitialSvgCoordinate: SVGRect) => () => SvgDragSelectElement[] =
  SVGSVGElement.prototype.getIntersectionList
  ? (svg, referenceElement, _, dragAreaInInitialSvgCoordinate) => () => Array.prototype.slice.call(svg.getIntersectionList(dragAreaInInitialSvgCoordinate, referenceElement!))
  : (svg, referenceElement, dragAreaInSvgCoordinate) => () => collectElements(svg, referenceElement, element => intersects(dragAreaInSvgCoordinate, element.getBBox()))

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
  let selectedElements: ReadonlyArray<SvgDragSelectElement> = []
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
      const dragAreaInClientCoordinate = calculateClientRect(event)
      const dragAreaInSvgCoordinate = clientRectToSvgRect(this, dragAreaInClientCoordinate)
      const dragAreaInInitialSvgCoordinate = svgRectToInitialSvgRect(this, dragAreaInSvgCoordinate)
      const referenceElement = options.referenceElement || null
      const newSelectedElements =
        typeof options.selector === 'function' ? options.selector({
          svg: this,
          referenceElement,
          pointerEvent: event,
          dragAreaInClientCoordinate,
          dragAreaInSvgCoordinate,
          dragAreaInInitialSvgCoordinate,
          getEnclosures: enclosureListGetter(this, referenceElement, dragAreaInSvgCoordinate, dragAreaInInitialSvgCoordinate),
          getIntersections: intersectionListGetter(this, referenceElement, dragAreaInSvgCoordinate, dragAreaInInitialSvgCoordinate)
        }) : (options.selector === 'intersection' ? intersectionListGetter : enclosureListGetter)(this, referenceElement, dragAreaInSvgCoordinate, dragAreaInInitialSvgCoordinate)()
      dragAreaOverlayStyle.left = dragAreaInClientCoordinate.x + 'px'
      dragAreaOverlayStyle.top = dragAreaInClientCoordinate.y + 'px'
      dragAreaOverlayStyle.width = dragAreaInClientCoordinate.width + 'px'
      dragAreaOverlayStyle.height = dragAreaInClientCoordinate.height + 'px'
      if (
        selectedElements.length !== newSelectedElements.length ||
        selectedElements.some(element => newSelectedElements.indexOf(element) === -1)
      ) {
        const previousSelectedElements = selectedElements
        selectedElements = newSelectedElements
        options.onSelectionChange && options.onSelectionChange({
          svg: this,
          referenceElement,
          pointerEvent: event,
          dragAreaInClientCoordinate,
          dragAreaInSvgCoordinate,
          dragAreaInInitialSvgCoordinate,
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
        referenceElement: options.referenceElement || null,
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
      const dragAreaInClientCoordinate = calculateClientRect(event)
      const dragAreaInSvgCoordinate = clientRectToSvgRect(this, dragAreaInClientCoordinate)
      const dragAreaInInitialSvgCoordinate = svgRectToInitialSvgRect(this, dragAreaInSvgCoordinate)
      options.onSelectionEnd && options.onSelectionEnd({
        svg: this,
        referenceElement: options.referenceElement || null,
        pointerEvent: event,
        dragAreaInClientCoordinate,
        dragAreaInSvgCoordinate,
        dragAreaInInitialSvgCoordinate,
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
