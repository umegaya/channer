import {FontFace} from "react-canvas"

var view_width = 0, view_height = 0;
export function init_metrics(width: number, height: number) {
    view_width = width;
    view_height = height;
}

export function vw(wratio: number): number {
    return view_width * wratio / 100;
}

export function vh(hratio: number): number {
    return view_height * hratio / 100;
}

var fontsizez: Array<number> = [
    24,
    16,
    12,
    8,
]

export function h(level: number) {
    return fontsizez[level - 1];
}

export var font = new FontFace("Roboto");
export var iconFont = new FontFace("channer-icons");
