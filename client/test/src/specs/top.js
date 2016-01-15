'use strict';

var common = require('../../utils/common');

var context = {
    channel_id: null,
}

module.exports = {
    'channel creation test' : function (browser) {
        common.setup(browser, function (browser, done) {
            browser
                //test expected tab is active
                .assert.elementPresent('.top .div-tab-element.not-active.create')
                .assert.elementPresent('.top .div-tab-element.active.latest')
                .assert.elementPresent('.top .div-tab-element.not-active.popular')
                //test tab active-ness is changed as expected
                .click('.top .div-tab-element.create')
                .pause(common.INPUT_PAUSE)
                //test expected elements exist
                .assert.elementPresent('.top .div-tab-element.active.create')
                .assert.elementPresent('.top .div-tab-element.not-active.latest')
                .assert.elementPresent('.top .name')
                .assert.elementPresent('.top .anon')
                .assert.elementPresent('.top .id-level')
                .assert.elementPresent('.top .display-style')
                .assert.elementPresent('.top .postlimit')
                .assert.elementPresent('.top .style')
                //test radiobutton behavior
                .assert.valueContains('.top .radio-options.id-level .active', "3")
                .click('.top .radio-options.id-level .none')
                .pause(common.INPUT_PAUSE)
                .assert.valueContains('.top .radio-options.id-level .active', "1")
                //test parameter validation works
                .assert.elementNotPresent('.top .button-send')
                .assert.elementPresent('.top .button-send-disabled')
                .perform(common.inputter('.top .name', common.CHANNEL_NAME))
                .pause(common.INPUT_PAUSE)
                .assert.elementPresent('.top .button-send')
                .assert.elementNotPresent('.top .button-send-disabled')
                //test transition when channel created
                .click('.top .button-send')
                .pause(common.TRANSITION_PAUSE)
                .execute(function () {
                    var current = window.channer.components.active;
                    if (!(current.component instanceof window.channer.components.Channel)) {
                        return ["channel component should be loaded"];
                    }
                    if (!current.component.id) {
                        return ["component should have id but its null"];
                    }
                    var id = current.component.id;
                    return [false, id];
                }, [], function (result) {
                    if (result.value[0]) {
                        throw new Error(result.value[0]);
                    }
                    console.log("script run finished id:" + result.value[1]);                    
                    context.channel_id = result.value[1];
                    return this;
                })
                //test tab URL works
                .url(common.BASEURL + '#/top/create')
                .pause(common.LOAD_PAUSE)
                .assert.elementPresent('.top .div-tab-element.active.create')
                .assert.elementPresent('.top .div-tab-element.not-active.latest')
                .click('.top .div-tab-element.latest')
                .pause(common.INPUT_PAUSE)
                //test expected elements exist
                .assert.elementPresent('.top .latest-list .div-container')
                .perform(function (client, done) {
                    client.assert.value('.top .latest-list .div-container:nth-of-type(1)', "/channel/" + context.channel_id)
                    done();
                })
                .assert.containsText('.top .latest-list .div-container:nth-of-type(1) .div-title.name', common.CHANNEL_NAME)
                .assert.elementPresent('.top .latest-list .div-container:nth-of-type(1) .div-image.idlevel-1')
                .expect.element('.top .latest-list .div-container:nth-of-type(1) .div-text.desc').text.to.equal("");
                done();
        })
    },
};
