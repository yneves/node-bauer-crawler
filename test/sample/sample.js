// - -------------------------------------------------------------------- - //

"use strict";

var assert = require("assert");
var Crawler = require("../../");

var crawler = new Crawler(__dirname + "/module/package.json");
var counter = 30;

crawler.start(function(promise) {
  assert.strictEqual(crawler.config.samplePlugin.slots,2);
  assert.strictEqual(crawler.config.samplePlugin.multiply,2);
  counter--;
  return promise
    .samplePlugin(10)
    .then(function(value) {
      assert.strictEqual(value,20);
    })
    .repeat(counter > 0);
});

// - -------------------------------------------------------------------- - //
