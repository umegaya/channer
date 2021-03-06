'use strict';

var common = require('../../utils/common');

var context = {
    secret: null,
    account_id: null,
    rescue_token: null,
    rescue_url: null,
    pass: null,
}

module.exports = {
    'bootstrap test' : function (browser) {
        browser
            .url(common.BASEURL + '?env=devtest')//initialize settings
            .pause(common.LOAD_PAUSE)
            .assert.title('Channer')
            .assert.elementPresent('.login')
            .assert.elementPresent('.login .input-text.user')
            .assert.elementPresent('.login .input-text.mail')
            .assert.elementPresent('.login button.disabled')
            .execute(function () {
                if (window.channer.app) {
                    return ["should not be mobile"];
                }
                if (window.channer.m.route().contains("top")) {
                    return ["login component should be loaded correctly"];
                }
                var expect_keys = [
                    "bootstrap", "conn", "config", "m", "mtransit", "ProtoBuf", 
                    "timer", "settings", "push", "rawfs", "fs", "hash", "storage",
                    "patch", "mobile", "onResume", "onPause", "onPush", "components", 
                    "testtmp", "l10n", "jsloader_promise"
                ];
                var found_count = 0;
                for (var k in window.channer) {
                    if (expect_keys.indexOf(k) < 0) {
                        return ["invalid member added:" + k];
                    }
                    found_count++;
                }
                if (expect_keys.length != found_count) {
                    return ["all of expected key does not exist in channer module"];
                }
                return [false];
            }, [], function (result) {
                if (result.value[0]) {
                    throw new Error(result.value[0]);
                }
                return this;
            })
            .perform(common.inputter('.login .mail', common.EMAIL))
            .pause(common.INPUT_PAUSE)
            .assert.elementNotPresent('.login button.enabled')
            .perform(common.inputter('.login .user', common.USERNAME))
            .pause(common.INPUT_PAUSE)
            .assert.elementPresent('.login button.enabled')
            .click('.login button.enabled')
            .pause(common.TRANSITION_PAUSE)
            .assert.elementNotPresent('.login')
            .assert.elementPresent('.top')
            .execute(function (user, mail) {
                if (window.channer.m.route().contains("top")) {
                    return ["top component should be loaded"];
                }
                if (window.channer.settings.values.user != user) {
                    return ["username should be same as specified:" + user + "|" + 
                    window.channer.settings.values.user];
                }
                if (window.channer.settings.values.mail != mail) {
                    return ["mail should be same as specified"];
                }
                var s = window.channer.settings.values.secret;
                if (!s) {
                    return ["secret should be initialized"];
                }
                var a = window.channer.settings.values.account_id;
                if (!a) {
                    return ["account_id should be initialized"];
                }
                var p = window.channer.settings.values.pass;
                if (!p) {
                    return ["pass should be initialized"];
                }
                return [false, a, p];
            }, [common.USERNAME, common.EMAIL], function (result) {
                if (result.value[0]) {
                    throw new Error(result.value[0]);
                }
                else {
                    if (result.value[1] == undefined) {
                        console.log(result.value);
                    } else {
                        context.account_id = result.value[1];
                        context.pass = result.value[2];
                    }
                }
                return this;
            })
            .assert.containsText('.header .latency', 'ms')
            .execute(function () {
                window.channer.conn.debug_close(2);
                return [false];
            }, [], function (result) {
                if (result.value[0]) {
                    throw new Error(result.value[0]);
                }
                return this;                
            })
            .pause(common.TRANSITION_PAUSE)
            .assert.elementNotPresent('.header .latency')
            .assert.elementPresent('.header .wait-reconnect')
            .pause(1000 * 4)
            .assert.elementPresent('.header .latency')
            .assert.elementNotPresent('.header .wait-reconnect')
            .url(common.BASEURL + '#/rescue')
            .pause(common.LOAD_PAUSE)
            .execute(function (baseurl) {
                try {
                    if (window.channer.m.route().contains("rescue")) {
                        return ["rescue component should be loaded"];
                    }
                    var url = current.ctrl.url()
                    var match = url.match(/\/rescue\/([a-z0-9]+)/);
                    if (!match) {
                        return ["url format is wrong[" + url + "]"];
                    }
                    return [false, match[1]];
                }
                catch (e) {
                    return [e.message];
                }
            }, [common.BASEURL], function (result) {
                if (result.value[0]) {
                    throw new Error(result.value[0]);   
                }
                else {
                    context.rescue_token = result.value[1];
                    context.rescue_url = 
                        common.BASEURL + "?env=devtest/#/rescue/" + context.rescue_token;
                }
                this.assert.attributeEquals(
                    '.rescue .textarea-readonly', 
                    'value', "/rescue/" + context.rescue_token)
                return this;
            })
            .end();
    },
    'rescue test' : function (browser) {
        browser
            .url(context.rescue_url)
            .pause(common.LOAD_PAUSE)
            .execute(function (username, mail, password, secret, account) {
                if (window.channer.m.route().contains("top")) {
                    return ["top component should be loaded"];
                }
                if (window.channer.settings.values.user != username) {
                    return ["username should be same as specified"];
                }
                if (window.channer.settings.values.mail != mail) {
                    return ["mail should be same as specified"];
                }
                if (window.channer.settings.values.pass != password) {
                    return ["pass should be same as specified:" + password + "|" + window.channer.settings.values.pass];
                }
                if (window.channer.settings.values.account_id != account) {
                    return ["account_id should be same as specified"];
                }
                if (window.channer.settings.values.secret == secret) {
                    return ["secret should be changed"];
                }
                return [false];
            }, [
                common.USERNAME, common.EMAIL, 
                context.pass, context.secret, context.account_id,
            ], function (result) {
                if (result.value[0]) {
                    throw new Error(result.value[0]);
                }
                return this;
            })
            .end();
    },
};
