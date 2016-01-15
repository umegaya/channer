'use strict';

var mod = {
    BASEURL: 'http://localhost:3000/',
    USERNAME: 'testuser',
    EMAIL: 'test@test.com',
    CHANNEL_NAME: "chtest",
    INPUT_PAUSE: 100,
    TRANSITION_PAUSE: 1000,
    LOAD_PAUSE: 4000,
}

mod.inputter = function (selector, input) {
    return function (client, done) {
        client.click(selector).setValue(selector, input)
        done();
    };
}
mod.setup = function (browser, test) {
    browser
        .url(mod.BASEURL + '?env=devtest')//initialize settings
        .pause(mod.LOAD_PAUSE)
        .perform(mod.inputter('.login .user', mod.USERNAME))
        .pause(mod.INPUT_PAUSE)
        .click('.login .button-send')
        .pause(mod.TRANSITION_PAUSE)
        .perform(test)
        .end();
}

module.exports = mod;
