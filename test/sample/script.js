// - -------------------------------------------------------------------- - //

"use strict";

var assert = require("assert");
var counter = 3;

module.exports = {
  
  name: "script",
  config: {
    samplePlugin: {
      slots: 2,
      multiply: 2
    }
  },
  plugins: [__dirname + "/sample-plugin.js"],
  
  main: function(Promise) {
    assert.strictEqual(this.config.samplePlugin.slots,2);
    assert.strictEqual(this.config.samplePlugin.multiply,2);
    counter--;
    return Promise
      .samplePlugin(10)
      .then(function(value) {
        assert.strictEqual(value,20);
      })
      .print(counter)
      .time(function() {
        return Promise.delay(100);
      })
      .then(function(time) {
        assert.ok(time > 100000000);
      })
      .repeat(counter > 0);
  }
  
};
