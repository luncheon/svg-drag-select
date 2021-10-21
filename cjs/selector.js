"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIntersections = exports.getEnclosures = exports.svgDragSelectElementTypes = void 0;
exports.svgDragSelectElementTypes = [SVGCircleElement, SVGEllipseElement, SVGImageElement, SVGLineElement, SVGPathElement, SVGPolygonElement, SVGPolylineElement, SVGRectElement, SVGTextElement, SVGUseElement];
var collectElements = function (into, svg, ancestor, filter) {
    for (var element = ancestor.firstElementChild; element; element = element.nextElementSibling) {
        if (element instanceof SVGGElement) {
            collectElements(into, svg, element, filter);
            continue;
        }
        for (var _i = 0, svgDragSelectElementTypes_1 = exports.svgDragSelectElementTypes; _i < svgDragSelectElementTypes_1.length; _i++) {
            var elementType = svgDragSelectElementTypes_1[_i];
            if (element instanceof elementType && filter(element)) {
                into.push(element);
            }
        }
    }
    return into;
};
var inRange = function (x, min, max) { return (min <= x && x <= max); };
var enclosures = function (areaInSvgCoordinate, bbox) {
    var left = areaInSvgCoordinate.x;
    var right = left + areaInSvgCoordinate.width;
    var top = areaInSvgCoordinate.y;
    var bottom = top + areaInSvgCoordinate.height;
    return (inRange(bbox.x, left, right) && inRange(bbox.x + bbox.width, left, right) &&
        inRange(bbox.y, top, bottom) && inRange(bbox.y + bbox.height, top, bottom));
};
var intersects = function (areaInSvgCoordinate, bbox) {
    var left = areaInSvgCoordinate.x;
    var right = left + areaInSvgCoordinate.width;
    var top = areaInSvgCoordinate.y;
    var bottom = top + areaInSvgCoordinate.height;
    return ((inRange(bbox.x, left, right) || inRange(bbox.x + bbox.width, left, right) || inRange(left, bbox.x, bbox.x + bbox.width)) &&
        (inRange(bbox.y, top, bottom) || inRange(bbox.y + bbox.height, top, bottom) || inRange(top, bbox.y, bbox.y + bbox.height)));
};
var getEnclosures = function (svg, referenceElement, areaInSvgCoordinate, areaInInitialSvgCoordinate) {
    return svg.getEnclosureList
        ? Array.prototype.slice.call(svg.getEnclosureList(areaInInitialSvgCoordinate, referenceElement))
        : collectElements([], svg, referenceElement || svg, function (element) { return enclosures(areaInSvgCoordinate, element.getBBox()); });
};
exports.getEnclosures = getEnclosures;
var getIntersections = function (svg, referenceElement, areaInSvgCoordinate, areaInInitialSvgCoordinate) {
    return svg.getIntersectionList
        ? Array.prototype.slice.call(svg.getIntersectionList(areaInInitialSvgCoordinate, referenceElement))
        : collectElements([], svg, referenceElement || svg, function (element) { return intersects(areaInSvgCoordinate, element.getBBox()); });
};
exports.getIntersections = getIntersections;
