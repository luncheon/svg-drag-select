export declare type SvgDragSelectElement = SVGCircleElement | SVGEllipseElement | SVGImageElement | SVGLineElement | SVGPathElement | SVGPolygonElement | SVGPolylineElement | SVGRectElement | SVGTextElement | SVGUseElement;
export declare const svgDragSelectElementTypes: ({
    new (): SVGCircleElement;
    prototype: SVGCircleElement;
} | {
    new (): SVGEllipseElement;
    prototype: SVGEllipseElement;
} | {
    new (): SVGImageElement;
    prototype: SVGImageElement;
} | {
    new (): SVGLineElement;
    prototype: SVGLineElement;
} | {
    new (): SVGPathElement;
    prototype: SVGPathElement;
} | {
    new (): SVGPolygonElement;
    prototype: SVGPolygonElement;
} | {
    new (): SVGRectElement;
    prototype: SVGRectElement;
} | {
    new (): SVGTextElement;
    prototype: SVGTextElement;
} | {
    new (): SVGUseElement;
    prototype: SVGUseElement;
})[];
export declare const getEnclosures: (svg: SVGSVGElement, referenceElement: SVGElement | null, areaInSvgCoordinate: SVGRect, areaInInitialSvgCoordinate: SVGRect) => any[];
export declare const getIntersections: (svg: SVGSVGElement, referenceElement: SVGElement | null, areaInSvgCoordinate: SVGRect, areaInInitialSvgCoordinate: SVGRect) => any[];
