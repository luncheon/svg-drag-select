// export type SvgDragSelectElement = ReturnType<SVGSVGElement["getIntersectionList"]> extends NodeListOf<infer T> ? T : never
export type SvgDragSelectElement = SVGCircleElement | SVGEllipseElement | SVGImageElement | SVGLineElement | SVGPathElement | SVGPolygonElement | SVGPolylineElement | SVGRectElement | SVGTextElement | SVGUseElement

export const svgDragSelectElementTypes = [SVGCircleElement, SVGEllipseElement, SVGImageElement, SVGLineElement, SVGPathElement, SVGPolygonElement, SVGPolylineElement, SVGRectElement, SVGTextElement, SVGUseElement]

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

export const getEnclosures =
  (svg: SVGSVGElement, referenceElement: SVGElement | null, areaInSvgCoordinate: SVGRect) =>
  collectElements(svg, referenceElement, element => enclosures(areaInSvgCoordinate, element.getBBox()))

export const getIntersections =
  (svg: SVGSVGElement, referenceElement: SVGElement | null, areaInSvgCoordinate: SVGRect) =>
  collectElements(svg, referenceElement, element => intersects(areaInSvgCoordinate, element.getBBox()))
