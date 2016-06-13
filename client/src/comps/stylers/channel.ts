import {vw, vh, h} from "../common/styler"

export class ChannelListStyler {
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
            fontSize: h(2),
            lineHeight: h(2) + vh(0.5),
        }
    }
    desc(): any {
        return {
            top: vh(4),
            left: vw(1) + vh(15),
            height: vh(2.5),
            width: vw(98) - vh(15),
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),            
        }
    }
    icon(wofs: number): any {
        return {
            top: vh(7),
            left: vw(1 + wofs) + vh(15),
            width: vh(4),
            height: vh(3),
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),
        }
    }
    attr_text(wofs: number): any {
        return {
            top: vh(7),
            left: vw(1 + wofs) + vh(2.5) + vh(15),
            width: vw(20),
            height: vh(2.5),
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),            
        }        
    }
}

