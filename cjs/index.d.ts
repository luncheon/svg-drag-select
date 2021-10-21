import { SvgDragSelectElement } from './selector';
export { SvgDragSelectElement } from './selector';
export declare type PointerEventLike = PointerEvent | Partial<PointerEvent> & MouseEvent | Partial<PointerEvent> & Touch & TouchEvent;
export interface SvgDragSelectionStart {
    readonly svg: SVGSVGElement;
    readonly referenceElement: SVGElement | null;
    readonly pointerEvent: PointerEventLike;
    cancel(): void;
}
export interface SvgDragSelectSelectorContext {
    readonly svg: SVGSVGElement;
    readonly referenceElement: SVGElement | null;
    readonly pointerEvent: PointerEventLike;
    readonly dragAreaInClientCoordinate: SVGRect;
    readonly dragAreaInSvgCoordinate: SVGRect;
    readonly dragAreaInInitialSvgCoordinate: SVGRect;
    getEnclosures(): SvgDragSelectElement[];
    getIntersections(): SvgDragSelectElement[];
}
export interface SvgDragSelectSelector<T = SvgDragSelectElement> {
    (context: SvgDragSelectSelectorContext): ReadonlyArray<SvgDragSelectElement>;
}
export interface SvgDragSelectionEnd {
    readonly svg: SVGSVGElement;
    readonly referenceElement: SVGElement | null;
    readonly pointerEvent: PointerEventLike;
    readonly dragAreaInClientCoordinate: SVGRect;
    readonly dragAreaInSvgCoordinate: SVGRect;
    readonly dragAreaInInitialSvgCoordinate: SVGRect;
    readonly selectedElements: ReadonlyArray<SvgDragSelectElement>;
}
export interface SvgDragSelectionChange extends SvgDragSelectionEnd {
    readonly previousSelectedElements: ReadonlyArray<SvgDragSelectElement>;
    readonly newlySelectedElements: ReadonlyArray<SvgDragSelectElement>;
    readonly newlyDeselectedElements: ReadonlyArray<SvgDragSelectElement>;
}
export interface SvgDragSelectOptions<T = SvgDragSelectElement> {
    readonly svg: SVGSVGElement;
    readonly referenceElement?: SVGElement;
    readonly onSelectionStart?: (event: SvgDragSelectionStart) => any;
    readonly onSelectionChange?: (event: SvgDragSelectionChange) => any;
    readonly onSelectionEnd?: (event: SvgDragSelectionEnd) => any;
    readonly selector?: 'intersection' | 'enclosure' | SvgDragSelectSelector<T>;
}
declare const _default: (options: SvgDragSelectOptions) => {
    cancel: () => void;
    dragAreaOverlay: HTMLDivElement;
};
export default _default;
