# svg-drag-select

A vanilla-js module for adding select-on-drag behavior to inline SVG elements.  
Lightweight (< 1 kB minified gzipped) with no dependencies.  
This simply listens drag events and calls [#getEnclosureList()](https://www.w3.org/TR/SVG11/struct.html#__svg__SVGSVGElement__getEnclosureList) or [#getIntersectionList()](https://www.w3.org/TR/SVG11/struct.html#__svg__SVGSVGElement__getIntersectionList).


[Demo](https://luncheon.github.io/svg-drag-select/)


## Installation

### via [npm](https://www.npmjs.com/package/svg-drag-select) (with a module bundler)

```
$ npm i svg-drag-select
```

```js
import "svg-drag-select"
```

### via CDN ([jsDelivr](https://www.jsdelivr.com/package/npm/svg-drag-select))

```html
<script src="https://cdn.jsdelivr.net/npm/svg-drag-select@0.1.0"></script>
```


## Usage and options

```js
// setup
const {
  cancel,           // cleanup funciton.
                    // `cancel()` removes event listeners and the `dragAreaOverlay` element below.
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

```css
/* please setup drag area overlay styles. */
.svg-drag-select-area-overlay {
  /* this is an example. */
  border: 1px dotted gray;
  background-color: rgba(255,255,255,.4)
}

/* for touch devices, please set `touch-action: pinch-zoom` to the svg element. */
svg#so-sexy-svg {
  touch-action: pinch-zoom;
}
```


## License

[WTFPL](http://www.wtfpl.net)