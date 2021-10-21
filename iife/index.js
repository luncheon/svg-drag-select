var svgDragSelect = (function () {
    'use strict';

    var svgDragSelectElementTypes = [SVGCircleElement, SVGEllipseElement, SVGImageElement, SVGLineElement, SVGPathElement, SVGPolygonElement, SVGPolylineElement, SVGRectElement, SVGTextElement, SVGUseElement];
    var collectElements = function (into, svg, ancestor, filter) {
        for (var element = ancestor.firstElementChild; element; element = element.nextElementSibling) {
            if (element instanceof SVGGElement) {
                collectElements(into, svg, element, filter);
                continue;
            }
            for (var _i = 0, svgDragSelectElementTypes_1 = svgDragSelectElementTypes; _i < svgDragSelectElementTypes_1.length; _i++) {
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
    var getIntersections = function (svg, referenceElement, areaInSvgCoordinate, areaInInitialSvgCoordinate) {
        return svg.getIntersectionList
            ? Array.prototype.slice.call(svg.getIntersectionList(areaInInitialSvgCoordinate, referenceElement))
            : collectElements([], svg, referenceElement || svg, function (element) { return intersects(areaInSvgCoordinate, element.getBBox()); });
    };

    var exclude = function (source, values) {
        return source.filter(function (element) { return values.indexOf(element) === -1; });
    };
    var createSvgRect = function (svg, x1, y1, x2, y2) {
        var svgRect = svg.createSVGRect();
        svgRect.x = Math.min(x1, x2);
        svgRect.y = Math.min(y1, y2);
        svgRect.width = Math.abs(x1 - x2);
        svgRect.height = Math.abs(y1 - y2);
        return svgRect;
    };
    var transformSvgRect = function (svg, matrix, rect) {
        if (!matrix) {
            return rect;
        }
        var point = svg.createSVGPoint();
        point.x = rect.x;
        point.y = rect.y;
        var p1 = point.matrixTransform(matrix);
        point.x += rect.width;
        point.y += rect.height;
        var p2 = point.matrixTransform(matrix);
        return createSvgRect(svg, p1.x, p1.y, p2.x, p2.y);
    };
    var index = (function (options) {
        var pointerId;
        var dragStartClientXPlusScrollX;
        var dragStartClientYPlusScrollY;
        var selectedElements = [];
        var svg = options.svg;
        var calculateClientRect = function (event) { return createSvgRect(svg, dragStartClientXPlusScrollX - document.documentElement.scrollLeft - document.body.scrollLeft, dragStartClientYPlusScrollY - document.documentElement.scrollTop - document.body.scrollTop, event.clientX, event.clientY); };
        var dragAreaOverlay = document.body.appendChild(document.createElement('div'));
        var dragAreaOverlayStyle = dragAreaOverlay.style;
        dragAreaOverlay.className = 'svg-drag-select-area-overlay';
        dragAreaOverlayStyle.position = 'fixed';
        dragAreaOverlayStyle.pointerEvents = 'none';
        dragAreaOverlayStyle.display = 'none';
        var onPointerMove = function (event) {
            var _this = this;
            if ((event.pointerId || 0) === pointerId) {
                var dragAreaInClientCoordinate = calculateClientRect(event);
                var dragAreaInSvgCoordinate_1 = transformSvgRect(this, this.getScreenCTM().inverse(), dragAreaInClientCoordinate);
                var dragAreaInInitialSvgCoordinate_1 = transformSvgRect(this, this.getCTM(), dragAreaInSvgCoordinate_1);
                var referenceElement_1 = options.referenceElement || null;
                var _getEnclosures = function () { return getEnclosures(_this, referenceElement_1, dragAreaInSvgCoordinate_1, dragAreaInInitialSvgCoordinate_1); };
                var _getIntersections = function () { return getIntersections(_this, referenceElement_1, dragAreaInSvgCoordinate_1, dragAreaInInitialSvgCoordinate_1); };
                var newSelectedElements = typeof options.selector === 'function' ? options.selector({
                    svg: this,
                    referenceElement: referenceElement_1,
                    pointerEvent: event,
                    dragAreaInClientCoordinate: dragAreaInClientCoordinate,
                    dragAreaInSvgCoordinate: dragAreaInSvgCoordinate_1,
                    dragAreaInInitialSvgCoordinate: dragAreaInInitialSvgCoordinate_1,
                    getEnclosures: _getEnclosures,
                    getIntersections: _getIntersections,
                }) : options.selector === 'intersection' ? _getIntersections() : _getEnclosures();
                var newlySelectedElements = exclude(newSelectedElements, selectedElements);
                var newlyDeselectedElements = exclude(selectedElements, newSelectedElements);
                dragAreaOverlayStyle.left = dragAreaInClientCoordinate.x + 'px';
                dragAreaOverlayStyle.top = dragAreaInClientCoordinate.y + 'px';
                dragAreaOverlayStyle.width = dragAreaInClientCoordinate.width + 'px';
                dragAreaOverlayStyle.height = dragAreaInClientCoordinate.height + 'px';
                if (newlySelectedElements.length || newlyDeselectedElements.length) {
                    var previousSelectedElements = selectedElements;
                    selectedElements = newSelectedElements;
                    options.onSelectionChange && options.onSelectionChange({
                        svg: this,
                        referenceElement: referenceElement_1,
                        pointerEvent: event,
                        dragAreaInClientCoordinate: dragAreaInClientCoordinate,
                        dragAreaInSvgCoordinate: dragAreaInSvgCoordinate_1,
                        dragAreaInInitialSvgCoordinate: dragAreaInInitialSvgCoordinate_1,
                        selectedElements: selectedElements,
                        previousSelectedElements: previousSelectedElements,
                        newlySelectedElements: newlySelectedElements,
                        newlyDeselectedElements: newlyDeselectedElements,
                    });
                }
            }
        };
        var onPointerDown = function (event) {
            if (event.isPrimary !== false && pointerId === undefined) {
                var canceled_1;
                options.onSelectionStart && options.onSelectionStart({
                    svg: this,
                    referenceElement: options.referenceElement || null,
                    pointerEvent: event,
                    cancel: function () { return canceled_1 = 1; },
                });
                if (!canceled_1) {
                    pointerId = event.pointerId || 0;
                    dragStartClientXPlusScrollX = event.clientX + document.documentElement.scrollLeft + document.body.scrollLeft;
                    dragStartClientYPlusScrollY = event.clientY + document.documentElement.scrollTop + document.body.scrollTop;
                    selectedElements = [];
                    onPointerMove.call(this, event);
                    dragAreaOverlayStyle.display = '';
                    this.setPointerCapture && this.setPointerCapture(pointerId);
                }
            }
        };
        var onPointerUp = function (event) {
            if ((event.pointerId || 0) === pointerId) {
                this.releasePointerCapture && this.releasePointerCapture(pointerId);
                pointerId = undefined;
                dragAreaOverlayStyle.display = 'none';
                var dragAreaInClientCoordinate = calculateClientRect(event);
                var dragAreaInSvgCoordinate = transformSvgRect(this, this.getScreenCTM().inverse(), dragAreaInClientCoordinate);
                var dragAreaInInitialSvgCoordinate = transformSvgRect(this, this.getCTM(), dragAreaInSvgCoordinate);
                options.onSelectionEnd && options.onSelectionEnd({
                    svg: this,
                    referenceElement: options.referenceElement || null,
                    pointerEvent: event,
                    dragAreaInClientCoordinate: dragAreaInClientCoordinate,
                    dragAreaInSvgCoordinate: dragAreaInSvgCoordinate,
                    dragAreaInInitialSvgCoordinate: dragAreaInInitialSvgCoordinate,
                    selectedElements: selectedElements,
                });
            }
        };
        var originalTouchAction = svg.style.touchAction;
        var originalComputedTouchAction = getComputedStyle(svg).touchAction;
        var cancel;
        if ('PointerEvent' in window) {
            var originalDraggable_1 = svg.getAttribute('draggable');
            var originalPointerEvents_1 = svg.style.pointerEvents;
            var changeTouchAction_1 = originalComputedTouchAction !== 'none' && originalComputedTouchAction !== 'pinch-zoom';
            if (changeTouchAction_1) {
                svg.style.touchAction = 'pinch-zoom';
            }
            svg.style.pointerEvents = 'all';
            svg.setAttribute('draggable', 'false');
            svg.addEventListener('pointerdown', onPointerDown);
            svg.addEventListener('pointermove', onPointerMove);
            svg.addEventListener('pointerup', onPointerUp);
            svg.addEventListener('pointercancel', onPointerUp);
            cancel = function () {
                if (originalDraggable_1 === null) {
                    svg.removeAttribute('draggable');
                }
                else {
                    svg.setAttribute('draggable', originalDraggable_1);
                }
                svg.style.pointerEvents = originalPointerEvents_1;
                if (changeTouchAction_1) {
                    svg.style.touchAction = originalTouchAction;
                }
                svg.removeEventListener('pointerdown', onPointerDown);
                svg.removeEventListener('pointermove', onPointerMove);
                svg.removeEventListener('pointerup', onPointerUp);
                svg.removeEventListener('pointercancel', onPointerUp);
                if (dragAreaOverlay.parentElement) {
                    dragAreaOverlay.parentElement.removeChild(dragAreaOverlay);
                }
            };
        }
        else if ('ontouchend' in window) {
            var changeTouchAction_2 = originalComputedTouchAction !== 'manipulation';
            if (changeTouchAction_2) {
                svg.style.touchAction = 'manipulation';
            }
            var touchEventToPointerEventLike_1 = function (event, touch) {
                var result = { pointerId: touch.identifier };
                Object.keys(Object.getPrototypeOf(touch)).forEach(function (key) { return result[key] = touch[key]; });
                Object.keys(Object.getPrototypeOf(event)).forEach(function (key) { return result[key] = event[key]; });
                return result;
            };
            var onTouchEnd = function (event) {
                if (pointerId !== undefined) {
                    for (var i = 0; i < event.changedTouches.length; i++) {
                        if (event.changedTouches[i].identifier === pointerId) {
                            onPointerUp.call(this, touchEventToPointerEventLike_1(event, event.changedTouches[0]));
                        }
                    }
                }
            };
            svg.addEventListener('touchstart', function (event) {
                if (event.touches.length === 1) {
                    onPointerDown.call(this, touchEventToPointerEventLike_1(event, event.touches[0]));
                }
            });
            svg.addEventListener('touchmove', function (event) {
                if (event.touches.length === 1) {
                    event.preventDefault();
                    onPointerMove.call(this, touchEventToPointerEventLike_1(event, event.touches[0]));
                }
            });
            svg.addEventListener('touchend', onTouchEnd);
            svg.addEventListener('touchcancel', onTouchEnd);
            cancel = function () {
                if (changeTouchAction_2) {
                    svg.style.touchAction = originalTouchAction;
                }
                svg.removeEventListener('pointerdown', onPointerDown);
                svg.removeEventListener('pointermove', onPointerMove);
                svg.removeEventListener('pointerup', onPointerUp);
                svg.removeEventListener('pointercancel', onPointerUp);
                if (dragAreaOverlay.parentElement) {
                    dragAreaOverlay.parentElement.removeChild(dragAreaOverlay);
                }
            };
        }
        else {
            svg.addEventListener('mousedown', onPointerDown);
            svg.addEventListener('mousemove', onPointerMove);
            svg.addEventListener('mouseup', onPointerUp);
            cancel = function () {
                svg.removeEventListener('mousedown', onPointerDown);
                svg.removeEventListener('mousemove', onPointerMove);
                svg.removeEventListener('mouseup', onPointerUp);
                if (dragAreaOverlay.parentElement) {
                    dragAreaOverlay.parentElement.removeChild(dragAreaOverlay);
                }
            };
        }
        return { cancel: cancel, dragAreaOverlay: dragAreaOverlay };
    });

    return index;

})();
