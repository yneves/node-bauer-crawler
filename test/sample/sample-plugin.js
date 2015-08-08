// - -------------------------------------------------------------------- - //

"use strict";

var assert = require("assert");

module.exports = {
  
  name: "samplePlugin",
  
  config: {
    workers: 1,
    multiply: 2
  },
  
  worker: function(worker,config) {
    assert.strictEqual(config.multiply,2);
    assert.strictEqual(config.slots,2);
    assert.strictEqual(worker._slots,2);
    worker.on("request",function(request,response) {
      response.sendOk({
        result: request.number * config.multiply
      });
    });
    worker.sendReady();
  },

  promise: {
    samplePlugin: function(number) {
      return this.then(function() {
        return this.requestWorker("samplePlugin",{ number: number }).get("result");
      });
    }
  }
  
};


// - -------------------------------------------------------------------- - //
