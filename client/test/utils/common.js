'use strict';

module.exports = {
    BASEURL: 'http://localhost:3000/',
    USERNAME: 'testuser',
    EMAIL: 'test@test.com',
    INPUT_PAUSE: 100,
    TRANSITION_PAUSE: 1000,
    LOAD_PAUSE: 4000,
    inputter: function (selector, input) {
        return function (client, done) {
            client.click(selector).setValue(selector, input)
            done();
        };
    }
}
