'use strict';

var common = require('../../utils/common');

var context = {
    channel_id: null,
}

var CREATE_MENU_SELECTOR = ".menu .container .create "

module.exports = {
    'channel creation test' : function (browser) {
        common.setup(browser, function (browser, done) {
            browser
                //test expected tab is active
                .assert.elementPresent('.top .tab-element.active.latest')
                .assert.elementPresent('.top .tab-element.not-active.popular')
                //test tab active-ness is changed as expected
                .click('.top .tab-element.popular')
                .pause(common.INPUT_PAUSE)
                //test expected elements exist
                .assert.elementPresent('.top .tab-element.active.popular')
                .assert.elementPresent('.top .tab-element.not-active.latest')
                //test menu button exists and works
                .assert.elementPresent('.menu .button')
                .assert.hidden('.menu .menu-1 .balloon')
                .click('.menu .button')
                .pause(common.ANIM_PAUSE)
                .assert.elementPresent('.menu .menu-1 .balloon')
                .assert.visible('.menu .menu-1 .balloon')
                //test menu button clicked again, then menu buttons are invisible
                .click('.menu .button')
                .pause(common.ANIM_PAUSE)
                .assert.elementPresent('.menu .menu-1 .balloon')
                .assert.hidden('.menu .menu-1 .balloon')
                //click button => menu-1 to show create channel menu
                .click('.menu .button')
                .pause(common.ANIM_PAUSE)
                .assert.visible('.menu .menu-1 .balloon')
                .click('.menu .menu-1 .balloon')
                .pause(common.ANIM_PAUSE)
                .assert.elementPresent(CREATE_MENU_SELECTOR)
                .assert.elementPresent(CREATE_MENU_SELECTOR + '.name')
                .assert.elementPresent(CREATE_MENU_SELECTOR + '.desc')
                //test expected element not exists (because detail link has not clicked)
                .assert.elementNotPresent(CREATE_MENU_SELECTOR + '.anon')
                .assert.elementNotPresent(CREATE_MENU_SELECTOR + '.id-level')
                .assert.elementNotPresent(CREATE_MENU_SELECTOR + '.display-style')
                .assert.elementNotPresent(CREATE_MENU_SELECTOR + '.postlimit')
                .assert.elementNotPresent(CREATE_MENU_SELECTOR + '.style')
                //test expected element exists (after detail link clicked)
                .click(CREATE_MENU_SELECTOR + 'a.enabled')
                .pause(common.INPUT_PAUSE)
                .assert.elementPresent(CREATE_MENU_SELECTOR + '.anon')
                .assert.elementPresent(CREATE_MENU_SELECTOR + '.id-level')
                .assert.elementPresent(CREATE_MENU_SELECTOR + '.display-style')
                .assert.elementPresent(CREATE_MENU_SELECTOR + '.postlimit')
                .assert.elementPresent(CREATE_MENU_SELECTOR + '.style')
                //test radiobutton behavior
                .assert.valueContains(CREATE_MENU_SELECTOR + '.block.id-level .radio-options .active', "3")
                .click(CREATE_MENU_SELECTOR + '.block.id-level .radio-options .none')
                .pause(common.INPUT_PAUSE)
                .assert.valueContains(CREATE_MENU_SELECTOR + '.block.id-level .radio-options .active', "1")
                //test parameter validation works
                .assert.elementNotPresent(CREATE_MENU_SELECTOR + 'button.enabled')
                .assert.elementPresent(CREATE_MENU_SELECTOR + 'button.disabled')
                .perform(common.inputter(CREATE_MENU_SELECTOR + '.name', common.CHANNEL_NAME))
                .pause(common.INPUT_PAUSE)
                .assert.elementPresent(CREATE_MENU_SELECTOR + 'button.enabled')
                .assert.elementNotPresent(CREATE_MENU_SELECTOR + 'button.disabled')
                //test transition when channel created
                .click(CREATE_MENU_SELECTOR + 'button.enabled')
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
                .url(common.BASEURL + '#/top/popular')
                .pause(common.LOAD_PAUSE)
                .assert.elementPresent('.top .tab-element.active.popular')
                .assert.elementPresent('.top .tab-element.not-active.latest')
                .click('.top .tab-element.latest')
                .pause(common.INPUT_PAUSE)
                //test expected elements exist
                .assert.elementPresent('.top .listview.latest .block')
                .perform(function (client, done) {
                    client.assert.attributeEquals('.top .listview.latest .block:nth-of-type(1)', 
                        'href', "/channel/" + context.channel_id)
                    done();
                })
                .assert.containsText('.top .listview.latest .block:nth-of-type(1) .title-h2', common.CHANNEL_NAME)
                .assert.elementPresent('.top .listview.latest .block:nth-of-type(1) .idlevel-1')
                //todo: match with globalization label
                .expect.element('.top .listview.latest .block:nth-of-type(1) .desc').text.to.equal("説明はありません");
                done();
        })
    },
};
