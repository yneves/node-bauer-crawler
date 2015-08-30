// - -------------------------------------------------------------------- - //

"use strict";

var cp = require("child_process");
var assert = require("assert");
var Crawler = require("../");

// - -------------------------------------------------------------------- - //

describe("Crawler",function() {

  it("constructor",function() {
    var crawler = new Crawler();
    assert.ok(crawler instanceof Crawler);
  });
  
  it("sample",function(done) {
    var proc = cp.spawn("node",[__dirname + "/sample/sample.js"],{ stdio: "pipe" });
    var output = "";
    proc.stdout.on("data",function(data) {
      output += data.toString("utf8");
    });
    var error = "";
    proc.stderr.on("data",function(data) {
      error += data.toString("utf8");
    });
    proc.on("exit",function() {
      assert.equal(error,"");
      assert.strictEqual(output.length,94);
      assert.strictEqual(output.split("\n").length,31);
      done();
    });
  });
  
});

// - -------------------------------------------------------------------- - //
