import {vw, vh, h, font} from "../common/styler"
import {measureText, Measure, FontFace} from "react-canvas"
import ChannerProto = Proto2TypeScript.ChannerProto;

export class TopicListStyler {
    model: ChannerProto.Model.Topic;
    imageUrl: string;
    textWidth: number;
    titleHeight: number;
    //handle variable properties
    set_model(model: ChannerProto.Model.Topic): void {
        this.model = model;
        //temporary test for image displaying
        if (model.id.modulo(100).toNumber() < 50) {
            var index = model.id.modulo(10).toNumber() + 1;
            this.imageUrl = "http://lorempixel.com/360/420/cats/" + index + "/";
        } else {
            this.imageUrl = null;
        }
        this.textWidth = (this.imageUrl != null) ? (vw(100) - vh(15)) : vw(100);
        var texts = this.get_title_text();
        var measure = measureText(texts, 
            this.textWidth, font, 
            h(2), h(2) + vh(0.5));
        this.titleHeight = measure.height;
    }
    get_title_text():string {
        var model = this.model;
        return model.title + "/" + model.point + "," + model.vote + "/" + model.locale + "/" + model.content;
    }
    image_url():string {
        return this.imageUrl;
    }
    height(): number {
        return this.titleHeight + vh(10);
    }

    //metrics
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
            left: this.textWidth + vh(1),
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

