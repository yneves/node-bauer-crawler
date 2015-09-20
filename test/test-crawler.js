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
  
  it("should load from module",function(done) {
    var proc = cp.spawn("node",[__dirname + "/sample/sample-module.js"],{ stdio: "pipe" });
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
      assert.strictEqual(output.split("\n").length,4);
      done();
    });
  });
  
  it("should load from script",function(done) {
    var proc = cp.spawn("node",[__dirname + "/sample/sample-script.js"],{ stdio: "pipe" });
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
      assert.strictEqual(output.split("\n").length,4);
      done();
    });
  });
  
});

// - -------------------------------------------------------------------- - //
