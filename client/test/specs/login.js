'use strict';

module.exports = {

  'bootstrap test' : function (browser) {
    var USERNAME = 'testuser';
    browser
      .url('http://localhost:3000/')
      .pause(1000)
      .assert.title('Channer')
      .assert.elementPresent('.login')
      .assert.elementPresent('.login .input-user')
      .assert.elementPresent('.login .input-mail')
      .assert.elementPresent('.login .button-login-disabled')
      .execute(function () {
        if (window.channer.mobile) {
            return "should not be mobile";
        }
        var expect_keys = [
            "bootstrap", "conn", "config", "m", "ProtoBuf", 
            "timer", "settings", "push", "rawfs", "fs", "hash", "storage",
            "patch", "mobile", "onResume", "onPause", "onPush", "components"
        ];
        var found_count = 0;
        for (var k in window.channer) {
            if (expect_keys.indexOf(k) < 0) {
                return "invalid member added:" + k;
            }
            found_count++;
        }
        if (expect_keys.length != found_count) {
            return "all of expected key does not exist in channer module";
        }
        return null;
      }, [], function (result) {
          if (result.value != null) {
              throw new Error(result.value);
          }
          return this;
      })
      .setValue('.login .input-user', [USERNAME, browser.Keys.ENTER])
      .pause(10)
      .assert.elementPresent('.login .button-login')
      .click('.login .button-login')
      .pause(1000)
      .assert.elementNotPresent('.login')
      .assert.elementPresent('.channel-list')
      .end();
  }
};
