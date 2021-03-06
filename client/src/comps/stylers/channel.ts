import {vw, vh, h, font, iconFont} from "../common/styler"

export class ChannelListStyler {
    bg(): any {
        return {
            top: vh(0),
            left: vw(0),
            height: vh(15) - 0.5,
            width: vw(100),
            backgroundColor:"#ffffff",
        }
    }
    img(): any {
        return {
            top: vh(1),
            left: vw(1),
            height: vh(13),
            width: vh(13),
        }
    }
    name(): any {
        return {
            top: vh(1),
            left: vw(1) + vh(15),
            height: vh(3.5),
            width: vw(98) - vh(15),
            fontFace: font,
            fontSize: h(2),
            lineHeight: h(2) + vh(0.5),
        }
    }
    desc(): any {
        return {
            top: vh(4.5),
            left: vw(1) + vh(15),
            height: vh(6),
            width: vw(98) - vh(15),
            color: "#aaaaaa",
            fontFace: font,
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),            
        }
    }
    icon(wofs: number): any {
        return {
            top: vh(11),
            left: vw(1 + wofs) + vh(15),
            width: vh(2.5),
            height: vh(2.5),
            fontFace: iconFont,
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),
        }
    }
    attr_text(wofs: number): any {
        return {
            top: vh(11),
            left: vw(1 + wofs) + vh(3) + vh(15),
            width: vw(20),
            height: vh(2.5),
            fontFace: font,
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),            
        }        
    }
}

