export declare type SvgDragSelectElement = SVGCircleElement | SVGEllipseElement | SVGImageElement | SVGLineElement | SVGPathElement | SVGPolygonElement | SVGPolylineElement | SVGRectElement | SVGTextElement | SVGUseElement;
export interface SvgDragSelectionStart {
    readonly svg: SVGSVGElement;
    readonly pointerEvent: PointerEvent;
    readonly dragStartClientX: number;
    readonly dragStartClientY: number;
    readonly currentClientX: number;
    readonly currentClientY: number;
    cancel(): void;
}
export interface SvgDragSelectionEnd {
    readonly svg: SVGSVGElement;
    readonly pointerEvent: PointerEvent;
    readonly dragStartClientX: number;
    readonly dragStartClientY: number;
    readonly currentClientX: number;
    readonly currentClientY: number;
    readonly selectedElements: ReadonlyArray<SvgDragSelectElement>;
}
export interface SvgDragSelectionChange extends SvgDragSelectionEnd {
    readonly previousSelectedElements: ReadonlyArray<SvgDragSelectElement>;
}
export interface SvgDragSelectOptions {
    readonly svg: SVGSVGElement;
    readonly referenceElement?: SVGElement;
    readonly onSelectionStart?: (event: SvgDragSelectionStart) => any;
    readonly onSelectionChange?: (event: SvgDragSelectionChange) => any;
    readonly onSelectionEnd?: (event: SvgDragSelectionEnd) => any;
    readonly intersection?: boolean;
}
declare const _default: (options: SvgDragSelectOptions) => {
    dragAreaOverlay: HTMLDivElement;
    cancel: () => void;
};
export default _default;
