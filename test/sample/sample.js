// - -------------------------------------------------------------------- - //

"use strict";

var assert = require("assert");
var Crawler = require("../../");

var crawler = new Crawler(__dirname + "/module/package.json");

crawler.start(function(bauer) {
  assert.strictEqual(crawler.config.samplePlugin.slots,2);
  assert.strictEqual(crawler.config.samplePlugin.multiply,2);
  bauer.samplePlugin(10)
    .then(function(value) {
      assert.strictEqual(value,20);
    })
    .exit();
    
});

// - -------------------------------------------------------------------- - //
