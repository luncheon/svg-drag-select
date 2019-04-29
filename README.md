# svg-drag-select

A lightweight (~ 1.8 kB minified gzipped) vanilla-js module for adding select-on-drag behavior to inline SVG elements.  
[Demo](https://luncheon.github.io/svg-drag-select/)


## Installation

### via [npm](https://www.npmjs.com/package/svg-drag-select) (with a module bundler)

```
$ npm i svg-drag-select
```

```js
import svgDragSelect from "svg-drag-select"
```

### via CDN ([jsDelivr](https://www.jsdelivr.com/package/npm/svg-drag-select))

```html
<script src="https://cdn.jsdelivr.net/npm/svg-drag-select@0.3.1"></script>
<script>/* `window.svgDragSelect` function is available */</script>
```


## Usage and options

* JavaScript

```js
const {
  cancel,           // cleanup funciton.
                    // please call `cancel()` when the select-on-drag behavior is no longer needed.
  dragAreaOverlay,  // a div element overlaying dragging area.
                    // you can customize the style of this element.
                    // this element has "svg-drag-select-area-overlay" class by default.
} = svgDragSelect({
  // the svg element (required).
  svg: document.getElementById("so-sexy-svg"),

  // followings are optional parameters with default values.
  referenceElement: null,     // selects only descendants of this SVGElement if specified.
  selector: "enclosure",      // "enclosure": selects enclosed elements using getEnclosureList().
                              // "intersection": selects intersected elements using getIntersectionList().
                              // function: custom selector implementation

  // followings are optional selection handlers
  onSelectionStart({
    svg,                      // the svg element.
    pointerEvent,             // a "pointerdown" event.
    cancel,                   // cancel() cancels.
  }) {
    // for example: handles mouse left button only.
    if (pointerEvent.button !== 0) {
      cancel()
      return
    }
    // for example: clear "data-selected" attribute
    const selectedElements = svg.querySelectorAll('[data-selected]')
    for (let i = 0; i < selectedElements.length; i++) {
      selectedElements[i].removeAttribute('data-selected')
    }
  },

  onSelectionChange({
    svg,                      // the svg element.
    pointerEvent,             // either a "pointerdown" event or a "pointermove" event.
    selectedElements,         // selected element array.
    previousSelectedElements, // previous selected element array.
    newlySelectedElements,    // `selectedElements - previousSelectedElements`
    newlyDeselectedElements,  // `previousSelectedElements - selectedElements`
  }) {
    // for example: toggle "data-selected" attribute
    newlyDeselectedElements.forEach(element => element.removeAttribute('data-selected'))
    newlySelectedElements.forEach(element => element.setAttribute('data-selected', ''))
  },

  onSelectionEnd({
    svg,                      // the svg element.
    pointerEvent,             // either a "pointerup" event or a "pointercancel" event.
    selectedElements,         // selected element array.
  }) {
  },
})
```

* CSS

```css
/* please setup drag area overlay styles. for example: */
.svg-drag-select-area-overlay {
  border: 1px dotted gray;
  background-color: rgba(255,255,255,.4);
}
```

### Custom Selector

You may need to implement your own selector function because:

* If `"intersection"` is specified as `selector` option,
  * If [`svg.getIntersectionList`](https://www.w3.org/TR/2011/REC-SVG11-20110816/struct.html#__svg__SVGSVGElement__getIntersectionList) is available,  
    `svg.getIntersectionList(referenceElement, dragAreaInInitialSvgCoordinate)` is used.
    * Chrome and Safari's `getIntersectionList()` implementation is poor: they seem to check only bounding boxes.
  * If `svg.getIntersectionList` is not available,  
    `svg-drag-select` uses its own implementation that checks only bounding boxes.
    * [Firefox does not yet support `getIntersectionList()` and `getEnclosureList()`.](https://bugzilla.mozilla.org/show_bug.cgi?id=501421)
* Implementing a good `"intersection"` selector is so hard for me because stricity and performance are in a trade-off relationship.
  * (BTW, IE 11 seems to have a good `SVGSVGElement.prototype.getIntersectionList()` implementation...)

The following is a custom selector example written for [demo](https://luncheon.github.io/svg-drag-select/).

```js
const strictIntersectionSelector = ({
  svg,                            // the svg element.
  referenceElement,               // please select only descendants of this SVGElement if specified.
  pointerEvent,                   // either a "pointerdown" event or a "pointermove" event.
  dragAreaInClientCoordinate,     // a `SVGRect` that represents the dragging area in client coordinate.
  dragAreaInSvgCoordinate,        // a `SVGRect` that represents the dragging area in svg coordinate.
  dragAreaInInitialSvgCoordinate, // a `SVGRect` that represents the dragging area in initial viewport coordinate of the svg.
  getEnclosures,                  // `getEnclosures()` returns elements enclosed in the dragging area.
  getIntersections,               // `getIntersections()` returns elements intersect the dragging area.
                                  // Chrome, Safari and Firefox checks only bounding box intersection.
}) => getIntersections().filter(element => {
  // the element that the pointer event raised is considered to intersect.
  if (pointerEvent.target === element) {
    return true
  }
  // strictly check only <path>s.
  if (!(element instanceof SVGPathElement)) {
    return true
  }
  // check if there is at least one enclosed point in the path.
  for (let i = 0, len = element.getTotalLength(); i <= len; i += 4 /* arbitrary */) {
    const { x, y } = element.getPointAtLength(i)
    if (
        dragAreaInSvgCoordinate.x <= x && x <= dragAreaInSvgCoordinate.x + dragAreaInSvgCoordinate.width &&
        dragAreaInSvgCoordinate.y <= y && y <= dragAreaInSvgCoordinate.y + dragAreaInSvgCoordinate.height
    ) {
      return true
    }
  }
  return false
})

svgDragSelect({
  selector: strictIntersectionSelector,
  /* ... */
})
```


## License

[WTFPL](http://www.wtfpl.net)
