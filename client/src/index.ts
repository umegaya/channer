/// <reference path="../typings/main.d.ts"/>

import {Component} from "./main"


m.mount(document.body, new Component({
	url: "ws://localhost:8888/ws"
}))
