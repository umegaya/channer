import {vw, vh, h, font} from "../common/styler"
import {measureText, Measure, FontFace} from "react-canvas"

export class TopicListStyler {
    textWidth: number;
    titleHeight: number;
    has_image(yes: boolean):boolean {
        this.textWidth = yes ? (vw(98) - vh(15)) : vw(98);
        return yes;
    }
    set_texts(texts: string, font?: FontFace): void {
        var measure = measureText(texts, 
            this.textWidth, font || FontFace.Default(), 
            h(2), h(2) + vh(0.5));
        this.titleHeight = measure.height;
    }
    height(): number {
        return this.titleHeight + vh(10);
    }
    bg(): any {
        return {
            top: vh(0),
            left: vw(0),
            height: this.height() - 0.5,
            width: vw(100),
            backgroundColor:"#ffffff",
        }
    }
    img(): any {
        return {
            top: vh(1),
            left: this.textWidth,
            height: vh(13),
            width: vh(13),
        }
    }
    point(): any {
        return {
            top: vh(4) + this.titleHeight,
            left: vw(1),
            height: vh(4),
            width: vh(13),
            fontFace: font,
            fontSize: h(2),
            lineHeight: h(2) + vh(0.5),
        }
    }
    point_unit(point: string): any {
        var l = vw(point.length * 3);　//3vw * length
        return {
            top: vh(4) + this.titleHeight,
            left: vw(1) + vw(0.5) + l,
            height: vh(4),
            width: vw(10),
            fontFace: font,
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),
        }
    }
    title(): any {
        return {
            top: vh(1),
            left: vw(1),
            height: this.titleHeight,
            width: this.textWidth,
            fontFace: font,
            fontSize: h(2),
            lineHeight: h(2) + vh(0.5),
        }
    }
    channel_name(): any {
        return {
            top: vh(1.5) + this.titleHeight,
            left: vw(1),
            height: vh(3.5),
            width: this.textWidth,
            color: "#aaaaaa",
            fontFace: font,
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),            
        }
    }
    icon(wofs: number, hofs: number): any {
        return {
            top: vh(4.5) + vh(hofs) + this.titleHeight,
            left: vw(1 + wofs) + vh(15),
            width: vh(2.5),
            height: vh(2.5),
            fontFace: font,
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),
        }
    }
    attr_text(wofs: number, hofs: number): any {
        return {
            top: vh(4.5) + vh(hofs) + this.titleHeight,
            left: vw(1 + wofs) + vh(3) + vh(15),
            width: vw(20),
            height: vh(2.5),
            fontFace: font,
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),            
        }
    }
}

