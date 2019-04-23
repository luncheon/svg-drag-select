var svgDragSelect = (function () {
    'use strict';

    var nonPassive;
    try {
        var options = Object.defineProperty({}, 'passive', {
            get: function () {
                nonPassive = { passive: false };
            }
        });
        var noop = function () { };
        addEventListener('t', noop, options);
        removeEventListener('t', noop, options);
    }
    catch (err) { }
    var index = (function (options) {
        var svg = options.svg;
        var pointerId;
        var dragStartPoint;
        var selectedElements = [];
        var dragAreaOverlay = document.body.appendChild(document.createElement('div'));
        var dragAreaOverlayStyle = dragAreaOverlay.style;
        dragAreaOverlay.className = 'svg-drag-select-area-overlay';
        dragAreaOverlayStyle.position = 'fixed';
        dragAreaOverlayStyle.pointerEvents = 'none';
        var onPointerMove = function (event) {
            if (dragStartPoint && event.pointerId === pointerId) {
                if (event.type === 'pointermove' && event.pointerType === 'touch') {
                    event.preventDefault();
                }
                var currentClientX = event.clientX;
                var currentClientY = event.clientY;
                dragAreaOverlayStyle.left = Math.min(dragStartPoint.x, currentClientX) + 'px';
                dragAreaOverlayStyle.top = Math.min(dragStartPoint.y, currentClientY) + 'px';
                dragAreaOverlayStyle.width = Math.abs(dragStartPoint.x - currentClientX) + 'px';
                dragAreaOverlayStyle.height = Math.abs(dragStartPoint.y - currentClientY) + 'px';
                var transformMatrix = this.getCTM().multiply(this.getScreenCTM().inverse());
                var _a = dragStartPoint.matrixTransform(transformMatrix), x1 = _a.x, y1 = _a.y;
                var _b = DOMPointReadOnly
                    .fromPoint({ x: currentClientX, y: currentClientY })
                    .matrixTransform(transformMatrix), x2 = _b.x, y2 = _b.y;
                var rect = this.createSVGRect();
                rect.x = Math.min(x1, x2);
                rect.y = Math.min(y1, y2);
                rect.width = Math.abs(x1 - x2);
                rect.height = Math.abs(y1 - y2);
                var referenceElement = options.referenceElement || null;
                var newSelectedElements_1 = Array.prototype.slice.apply(options.intersection
                    ? this.getIntersectionList(rect, referenceElement)
                    : this.getEnclosureList(rect, referenceElement));
                if (selectedElements.length !== newSelectedElements_1.length ||
                    selectedElements.some(function (element) { return newSelectedElements_1.indexOf(element) === -1; })) {
                    var previousSelectedElements = selectedElements;
                    selectedElements = newSelectedElements_1;
                    options.onSelectionChange && options.onSelectionChange({
                        svg: this,
                        pointerEvent: event,
                        dragStartClientX: dragStartPoint.x,
                        dragStartClientY: dragStartPoint.y,
                        currentClientX: currentClientX,
                        currentClientY: currentClientY,
                        selectedElements: selectedElements,
                        previousSelectedElements: previousSelectedElements,
                    });
                }
            }
        };
        var onPointerDown = function (event) {
            if (event.isPrimary && pointerId === undefined) {
                var x = event.clientX, y = event.clientY;
                var canceled_1;
                options.onSelectionStart && options.onSelectionStart({
                    svg: this,
                    pointerEvent: event,
                    dragStartClientX: x,
                    dragStartClientY: y,
                    currentClientX: x,
                    currentClientY: y,
                    cancel: function () { return canceled_1 = true; },
                });
                if (canceled_1) {
                    return;
                }
                pointerId = event.pointerId;
                dragStartPoint = DOMPointReadOnly.fromPoint({ x: x, y: y });
                onPointerMove.call(this, event);
                dragAreaOverlayStyle.display = '';
                this.addEventListener('pointermove', onPointerMove, event.pointerType === 'touch' ? nonPassive : undefined);
                this.setPointerCapture(event.pointerId);
            }
        };
        var onPointerUp = function (event) {
            if (event.pointerId === pointerId) {
                this.releasePointerCapture(pointerId);
                this.removeEventListener('pointermove', onPointerMove);
                pointerId = undefined;
                dragAreaOverlayStyle.display = 'none';
                if (dragStartPoint) {
                    var _dragStartPoint = dragStartPoint;
                    dragStartPoint = undefined;
                    options.onSelectionEnd && options.onSelectionEnd({
                        svg: this,
                        pointerEvent: event,
                        dragStartClientX: _dragStartPoint.x,
                        dragStartClientY: _dragStartPoint.y,
                        currentClientX: event.clientX,
                        currentClientY: event.clientY,
                        selectedElements: selectedElements,
                    });
                }
            }
        };
        svg.addEventListener('pointerdown', onPointerDown);
        svg.addEventListener('pointerup', onPointerUp);
        svg.addEventListener('pointercancel', onPointerUp);
        return {
            dragAreaOverlay: dragAreaOverlay,
            cancel: function () {
                svg.removeEventListener('pointerdown', onPointerDown);
                svg.removeEventListener('pointerup', onPointerUp);
                svg.removeEventListener('pointermove', onPointerMove);
                svg.removeEventListener('pointercancel', onPointerUp);
                if (dragAreaOverlay.parentElement) {
                    dragAreaOverlay.parentElement.removeChild(dragAreaOverlay);
                }
            }
        };
    });

    return index;

}());
