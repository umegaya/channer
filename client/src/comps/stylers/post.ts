import {vw, vh, h, font} from "../common/styler"
import {measureText, Measure, FontFace} from "react-canvas"
import ChannerProto = Proto2TypeScript.ChannerProto;

export class PostListStyler {
    model: ChannerProto.Model.Post;
    elementHeight: number;
    vote: number;
    //handle variable properties
    set_model(model: ChannerProto.Model.Post): void {
        this.model = model;
        if (!model) { return; }
        var measure = measureText(model.content, 
            vw(100), font, 
            h(2), h(2) + vh(0.5));
        this.elementHeight = measure.height;
    }
    height(): number {
        if (!this.model) {
            return vh(15);
        }
        return this.elementHeight + vh(1);
    }
    bg(): any {
        return {
            top: vh(0.1),
            left: vw(0),
            height: this.height() - vh(0.1),
            width: vw(100),
            backgroundColor:"#ffffff",
        }
    }
    title(): any {
        return {
            top: vh(4.5),
            left: vw(1),
            height: this.height(),
            width: vw(100),
            fontFace: font,
            fontSize: h(2),
            lineHeight: h(2) + vh(0.5),
        }
    }
}

