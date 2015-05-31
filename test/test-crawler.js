// - -------------------------------------------------------------------- - //

"use strict";

var assert = require("assert");
var Crawler = require("../");

// - -------------------------------------------------------------------- - //

describe("Crawler",function() {

  it("constructor",function() {
    var crawler = new Crawler();
    assert.ok(crawler instanceof Crawler);
  });
  
});

// - -------------------------------------------------------------------- - //
