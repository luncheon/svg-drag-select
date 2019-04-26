# svg-drag-select

A vanilla-js module for adding select-on-drag behavior to inline SVG elements.  
[Demo](https://luncheon.github.io/svg-drag-select/)

* Lightweight (~ 1.6 kB minified gzipped)
  * Currently, [Pointer Events Polyfill](https://github.com/jquery/PEP) is required for Safari (but [Safari seems to support Pointer Events soon](https://webkit.org/blog/8676/release-notes-for-safari-technology-preview-78/)).  
    No other dependencies.


## Installation

### via [npm](https://www.npmjs.com/package/svg-drag-select) (with a module bundler)

```
$ npm i pepjs svg-drag-select
```

```js
import "pepjs"
import svgDragSelect from "svg-drag-select"
```

### via CDN ([jsDelivr](https://www.jsdelivr.com/package/npm/svg-drag-select))

```html
<script src="https://cdn.jsdelivr.net/npm/pepjs@0.5.2"></script>
<script src="https://cdn.jsdelivr.net/npm/svg-drag-select@0.2.0"></script>
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

* Chrome and Safari's `getIntersectionList()` implementation is poor: they seem to check only bounding boxes.  
  (BTW, IE 11 seems to have a good implementation...)
* If `SVGSVGElement.prototype.getIntersectionList` or `SVGSVGElement.prototype.getEnclosureList` is not available, `svg-drag-select` uses own implementation that checks only bounding boxes.
  * [Firefox does not yet support `getIntersectionList()` and `getEnclosureList()`.](https://bugzilla.mozilla.org/show_bug.cgi?id=501421)
* Implementing a good selector is so hard for me because stricity and performance are in a trade-off relationship.

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
  svg: document.getElementById("so-sexy-svg"),
  selector: strictIntersectionSelector,
  onSelectionChange({
    selectedElements,
    newlySelectedElements,
    newlyDeselectedElements,
  }) {
    selectionChange.newlyDeselectedElements.forEach(function (element) {
      element.removeAttribute('data-selected')
    })
    selectionChange.newlySelectedElements.forEach(function (element) {
      element.setAttribute('data-selected', '')
    })
  }
})
```


## License

[WTFPL](http://www.wtfpl.net)
