/*!
**  bauer-crawler -- Multi-thread crawler engine.
**  Copyright (c) 2015 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-crawler>
*/
// - -------------------------------------------------------------------- - //

"use strict";

var factory = require("bauer-factory");
var clusterModule = require("bauer-cluster");

factory.extendClass(clusterModule.Worker,require("./worker.js"));
factory.extendClass(clusterModule.Request,require("./request.js"));
factory.extendClass(clusterModule.Response,require("./response.js"));

module.exports = {

  master: function() {
    this.extendPromise(__dirname + "/promise.js");
    this.createWorkers();
  },
  
  worker: function(worker,config) {
    if (factory.isDefined(config.slots)) {
      worker._slots = config.slots;
    }
    if (factory.isDefined(config.delay)) {
      worker._delay = config.delay;
    }
  }
  
};

// - -------------------------------------------------------------------- - //
