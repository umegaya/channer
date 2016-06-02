/// <reference path="../typings/extern.d.ts"/>
import {m, Util} from "./uikit"
import {MenuComponent} from "./components/menu"

window.channer.router = function () {
	m.route.mode = "hash"; //prevent from refreshing page when route changes.
    //setup client router
    var last_url: string = window.channer.settings.values.last_url;
    var start_url: string = last_url ? ("/login?next=" + last_url) : "/login"; 
    var menu: MenuComponent = <MenuComponent>window.channer.components.Menu;
    var rt = menu.setup({
        "/login":            window.channer.components.Login,
        "/rescue":           window.channer.components.Rescue,
        "/rescue/:rescue":   window.channer.components.Login,
        "/top":              window.channer.components.Top,
        "/top/:tab":         window.channer.components.Top,
        "/top/:tab/:id":     window.channer.components.Top,
        "/channel/:ch":      window.channer.components.Channel,
        "/channel/:ch/:tab": window.channer.components.Channel,
        "/topic/:id":        window.channer.components.Topic,
    });
    for (var k in rt) {
        console.log("rt:" + k);
    }
    m.route(document.body, start_url, rt);
}
