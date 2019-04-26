import { nonPassive } from './non-passive';
import { SvgDragSelectElement, getEnclosures, getIntersections } from './selector';
export { SvgDragSelectElement } from './selector'

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
  readonly dragAreaInClientCoordinate: SVGRect
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
  readonly dragAreaInClientCoordinate: SVGRect
  readonly dragAreaInSvgCoordinate: SVGRect
  readonly dragAreaInInitialSvgCoordinate: SVGRect
  readonly selectedElements: ReadonlyArray<SvgDragSelectElement>
}

export interface SvgDragSelectionChange extends SvgDragSelectionEnd {
  readonly previousSelectedElements: ReadonlyArray<SvgDragSelectElement>
  readonly newlySelectedElements: ReadonlyArray<SvgDragSelectElement>
  readonly newlyDeselectedElements: ReadonlyArray<SvgDragSelectElement>
}

export interface SvgDragSelectOptions<T = SvgDragSelectElement> {
  readonly svg: SVGSVGElement
  readonly referenceElement?: SVGElement
  readonly onSelectionStart?: (event: SvgDragSelectionStart) => any
  readonly onSelectionChange?: (event: SvgDragSelectionChange) => any
  readonly onSelectionEnd?: (event: SvgDragSelectionEnd) => any
  readonly selector?: 'intersection' | 'enclosure' | SvgDragSelectSelector<T>
}

const exclude = <T>(source: ReadonlyArray<T>, values: ReadonlyArray<T>) =>
  source.filter(element => values.indexOf(element) === -1)

const createSvgRect = (svg: SVGSVGElement, x1: number, y1: number, x2: number, y2: number) => {
  const svgRect = svg.createSVGRect()
  svgRect.x = Math.min(x1, x2)
  svgRect.y = Math.min(y1, y2)
  svgRect.width = Math.abs(x1 - x2)
  svgRect.height = Math.abs(y1 - y2)
  return svgRect
}

const transformSvgRect = (svg: SVGSVGElement, matrix: DOMMatrix | null, rect: SVGRect) => {
  if (!matrix) {
    return rect
  }
  const point = svg.createSVGPoint()
  point.x = rect.x
  point.y = rect.y
  const p1 = point.matrixTransform(matrix)
  point.x += rect.width
  point.y += rect.height
  const p2 = point.matrixTransform(matrix)
  return createSvgRect(svg, p1.x, p1.y, p2.x, p2.y)
}

export default (options: SvgDragSelectOptions) => {
  let pointerId: number | undefined
  let dragStartClientXPlusScrollX: number | undefined
  let dragStartClientYPlusScrollY: number | undefined
  let selectedElements: ReadonlyArray<SvgDragSelectElement> = []
  const svg = options.svg
  const calculateClientRect = (event: PointerEvent) => createSvgRect(
    svg,
    dragStartClientXPlusScrollX! - document.documentElement.scrollLeft - document.body.scrollLeft,
    dragStartClientYPlusScrollY! - document.documentElement.scrollTop - document.body.scrollTop,
    event.clientX,
    event.clientY
  )
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
      const dragAreaInSvgCoordinate = transformSvgRect(this, this.getScreenCTM()!.inverse(), dragAreaInClientCoordinate)
      const dragAreaInInitialSvgCoordinate = transformSvgRect(this, this.getCTM(), dragAreaInSvgCoordinate)
      const referenceElement = options.referenceElement || null
      const _getEnclosures = () => getEnclosures(this, referenceElement, dragAreaInSvgCoordinate, dragAreaInInitialSvgCoordinate)
      const _getIntersections = () => getIntersections(this, referenceElement, dragAreaInSvgCoordinate, dragAreaInInitialSvgCoordinate)
      const newSelectedElements =
        typeof options.selector === 'function' ? options.selector({
          svg: this,
          referenceElement,
          pointerEvent: event,
          dragAreaInClientCoordinate,
          dragAreaInSvgCoordinate,
          dragAreaInInitialSvgCoordinate,
          getEnclosures: _getEnclosures,
          getIntersections: _getIntersections,
        }) : options.selector === 'intersection' ? _getIntersections() : _getEnclosures()
      const newlySelectedElements = exclude(newSelectedElements, selectedElements)
      const newlyDeselectedElements = exclude(selectedElements, newSelectedElements)
      dragAreaOverlayStyle.left = dragAreaInClientCoordinate.x + 'px'
      dragAreaOverlayStyle.top = dragAreaInClientCoordinate.y + 'px'
      dragAreaOverlayStyle.width = dragAreaInClientCoordinate.width + 'px'
      dragAreaOverlayStyle.height = dragAreaInClientCoordinate.height + 'px'
      if (newlySelectedElements.length || newlyDeselectedElements.length) {
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
          newlySelectedElements,
          newlyDeselectedElements,
        })
      }
    }
  }

  const onPointerDown = function (this: SVGSVGElement, event: PointerEvent) {
    if (event.isPrimary && pointerId === undefined) {
      let canceled: number | undefined
      options.onSelectionStart && options.onSelectionStart({
        svg: this,
        referenceElement: options.referenceElement || null,
        pointerEvent: event,
        cancel: () => canceled = 1,
      })
      if (!canceled) {
        pointerId = event.pointerId
        dragStartClientXPlusScrollX = event.clientX + document.documentElement.scrollLeft + document.body.scrollLeft
        dragStartClientYPlusScrollY = event.clientY + document.documentElement.scrollTop + document.body.scrollTop
        selectedElements = []
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
      const dragAreaInSvgCoordinate = transformSvgRect(this, this.getScreenCTM()!.inverse(), dragAreaInClientCoordinate)
      const dragAreaInInitialSvgCoordinate = transformSvgRect(this, this.getCTM(), dragAreaInSvgCoordinate)
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

  const originalDraggable = svg.getAttribute('draggable')
  const originalPointerEvents = svg.style.pointerEvents
  const originalTouchAction = svg.style.touchAction
  const originalComputedTouchAction = getComputedStyle(svg).touchAction
  const changeTouchAction = getComputedStyle(svg).touchAction !== 'none' && originalComputedTouchAction !== 'pinch-zoom'
  if (changeTouchAction) {
    svg.style.touchAction = 'pinch-zoom'
  }
  svg.style.pointerEvents = 'all'
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
      if (changeTouchAction) {
        svg.style.touchAction = originalTouchAction
      }
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
