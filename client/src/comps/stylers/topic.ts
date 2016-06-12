import {vw, vh, h} from "../common/styler"

export class TopicListStyler {
    img(): any {
        return {
            top: vh(5),
            left: vw(1),
            height: vh(13),
            width: vh(13),
        }
    }
    point(): any {
        return {
            top: vh(1),
            left: vw(1),
            height: vh(3),
            width: vh(3),
            fontSize: h(1),
            lineHeight: h(1) + vh(0.5),
        }
    }
    point_unit(): any {
        return {
            top: vh(2),
            left: vw(1) + vh(3),
            height: vh(2),
            width: vh(2),
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),
        }
    }
    channel_name(): any {
        return {
            top: vh(1),
            left: vw(1) + vh(15),
            height: vh(3.5),
            width: vw(98),
            fontSize: h(2),
            lineHeight: h(2) + vh(0.5),
        }
    }
    title(): any {
        return {
            top: vh(4),
            left: vw(1) + vh(15),
            height: vh(5),
            width: vw(98),
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),            
        }
    }
    icon(wofs: number, hofs: number): any {
        return {
            top: vh(9) + vh(hofs),
            left: vw(1 + wofs) + vh(15),
            width: vh(4),
            height: vh(3),
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),
        }
    }
    attr_text(wofs: number, hofs: number): any {
        return {
            top: vh(9) + vh(hofs),
            left: vw(1 + wofs) + vh(2.5) + vh(15),
            width: vw(20),
            height: vh(2.5),
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),            
        }
    }
}

