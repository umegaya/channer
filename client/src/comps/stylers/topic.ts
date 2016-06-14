import {vw, vh, h} from "../common/styler"
import {measureText, Measure, FontFace} from "react-canvas"

export class TopicListStyler {
    textOffset: number;
    titleHeight: number;
    has_image(yes: boolean):boolean {
        this.textOffset = yes ? vh(15) : vh(0);
        return yes;
    }
    set_texts(texts: string, font?: FontFace): void {
        var measure = measureText(texts, 
            vw(98) - this.textOffset, font || FontFace.Default(), 
            h(2), h(2) + vh(0.5));
        this.titleHeight = measure.height;
    }
    height(): number {
        return this.titleHeight + vh(10);
    }
    img(): any {
        return {
            top: vh(1),
            left: vw(1),
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
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),
        }
    }
    title(): any {
        return {
            top: vh(1),
            left: vw(1) + this.textOffset,
            height: this.titleHeight,
            width: vw(98) - this.textOffset,
            fontSize: h(2),
            lineHeight: h(2) + vh(0.5),
        }
    }
    channel_name(): any {
        return {
            top: vh(1.5) + this.titleHeight,
            left: vw(1) + this.textOffset,
            height: vh(3.5),
            width: vw(98) - this.textOffset,
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),            
        }
    }
    icon(wofs: number, hofs: number): any {
        return {
            top: vh(4.5) + vh(hofs) + this.titleHeight,
            left: vw(1 + wofs) + vh(15),
            width: vh(4),
            height: vh(3),
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),
        }
    }
    attr_text(wofs: number, hofs: number): any {
        return {
            top: vh(4.5) + vh(hofs) + this.titleHeight,
            left: vw(1 + wofs) + vh(2.5) + vh(15),
            width: vw(20),
            height: vh(2.5),
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),            
        }
    }
}

