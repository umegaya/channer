/// <reference path="../typings/extern.d.ts"/>
var _L = window.channer.l10n.translate;
var data = JSON.parse(require('./taxonomy/category.json'));
var cats: Array<string> = [];
for (var i = 0; i < data.length; i++) {
    if (!data[i].private) {
        cats.push(_L(data[i].name));
    }
}
window.channer.category.data = cats;
window.channer.category.from_id = (id: number): string => {
    return cats[id - 1];
}
window.channer.category.to_id = (cat: string): number => {
    for (var i = 0; i < cats.length; i++) {
        if (cats[i] == cat) {
            return i + 1;
        }
    }
    return 0;
}
