/*!
**  bauer-crawler -- Multi-thread crawler engine.
**  Copyright (c) 2014 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-crawler>
*/
// - -------------------------------------------------------------------- - //

"use strict";

module.exports = function() {
  
  var cluster = this.cluster;
  var Promise = this.Promise = require("bluebird/js/main/promise")();
  
  Promise.prototype.request = Promise.request = function(role,request) {
    return new Promise(function(resolve,reject) {
      var worker = cluster.rotateWorker(role);
      if (worker) {
        worker.request(request,function(response) {
          if (response.ok) {
            resolve(response);
          } else {
            reject(new Error(response.error));
          }
        });
      } else {
        reject(new Error("no worker available"));
      }
    });
  };
  
  Promise.prototype.exit = function(then,fail) {
    return this.then(then).catch(fail).done(function() {
      process.exit();
    });
  };
  
  this.createWorkers();
};

// - -------------------------------------------------------------------- - //
