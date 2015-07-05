/*!
**  bauer-crawler -- Multi-thread crawler engine.
**  Copyright (c) 2015 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-crawler>
*/
// - -------------------------------------------------------------------- - //

"use strict";

var factory = require("bauer-factory");

module.exports = function(worker,config) {
  
  if (factory.isDefined(config.slots)) {
    worker._slots = config.slots;
  }
  
  if (factory.isDefined(config.delay)) {
    worker._delay = config.delay;
  }
  
};

// - -------------------------------------------------------------------- - //
