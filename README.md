# svg-drag-select

A vanilla-js module for adding select-on-drag behavior to inline SVG elements.  
[Demo](https://luncheon.github.io/svg-drag-select/)

This simply listens Pointer Events and calls [`getEnclosureList()`](https://www.w3.org/TR/SVG11/struct.html#__svg__SVGSVGElement__getEnclosureList) or [`getIntersectionList()`](https://www.w3.org/TR/SVG11/struct.html#__svg__SVGSVGElement__getIntersectionList).

* Lightweight (~ 1.1 kB minified gzipped)
  * Currently, [Pointer Events Polyfill](https://github.com/jquery/PEP) is required for Safari (but [Safari seems to support Pointer Events soon](https://webkit.org/blog/8676/release-notes-for-safari-technology-preview-78/)).  
    No other dependencies.
* Works correctly on IE 11.

⚠️ [Firefox does not support `getIntersectionList()` and `getEnclosureList()`.](https://bugzilla.mozilla.org/show_bug.cgi?id=501421)  
⚠️ Chrome and Safari's `getIntersectionList()` implementation is poor. IE 11 seems to be good.  


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
<script src="https://cdn.jsdelivr.net/npm/svg-drag-select@0.1.2"></script>
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
  svg: document.querySelector("svg#so-sexy-svg"),

  // followings are optional parameters with default values.
  referenceElement: null,     // selects only descendants of this SVGElement if specified.
  intersection: false,        // falsy:  selects enclosed elements.
                              // truthy: selects intersected elements.

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
  },

  onSelectionChange({
    svg,                      // the svg element.
    pointerEvent,             // either a "pointerdown" event or a "pointermove" event.
    selectedElements,         // selected element array.
    previousSelectedElements, // previous selected element array.
  }) {
    // maybe this is the main process.
    console.log(selectedElements)
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


## License

[WTFPL](http://www.wtfpl.net)
