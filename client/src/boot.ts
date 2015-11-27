/// <reference path="../typings/extern.d.ts"/>

import {Component, Config} from "./main"
import {m} from "./uikit"

window.channer.bootstrap = function (config: any) {	
	m.mount(document.body, new Component(new Config(config)));
}
