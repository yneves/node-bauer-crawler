(function() {
// - -------------------------------------------------------------------- - //

"use strict";

var events = require("events");
var factory = require("bauer-factory");
var Cluster = require("bauer-cluster").Cluster;

// - -------------------------------------------------------------------- - //

var Crawler = factory.createClass({
  
  inherits: events.EventEmitter,
  
  constructor: {
    o: function(config) {
      this.config = config;
      this.cluster = new Cluster();
      this.cluster.require("bauer-cluster-queue");
      this.cluster.require("bauer-cluster-super");
    }
  },
  
  getWorkerModule: function(worker) {
    var workerModule;
    var role = worker.args[0];
    if (factory.isString(role)) {
      if (factory.isObject(this.config[role])) {
        if (factory.isString(this.config[role].module)) {
          workerModule = this.config[role].module;
        }
      }
    }
    return workerModule;
  },
  
  getWorkerFork: function() {
    var fork = {};
    var roles = Object.keys(this.config);
    roles.forEach(function(role) {
      if (factory.isObject(this.config[role])) {
        if (factory.isNumber(this.config[role].workers)) {
          fork[role] = this.config[role].workers;
        }
      }
    }.bind(this));
    return fork;
  },
  
  startWorkers: function() {
    var _this = this;
    this.cluster.superFork(this.getWorkerFork());
    var total = this.cluster.workers.length;
    this.cluster.workers.forEach(function(worker) {
      worker.once("message",function(data) {
        if (data.ready) {
          if (--total === 0) {
            _this.emit("ready");
          }
        }
      });
    });
  },
  
  deferRequest: {
    so: function(role,request) {
      var _this = this;
      var Promise = this.Promise;
      return new Promise(function(resolve,reject) {
        var worker = _this.cluster.rotateWorker(role);
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
    }
  },
  
  start: function() {
    
    var _this = this;
    
    this.cluster.worker(function(worker) {
      worker.require(_this.getWorkerModule(worker));
    });
      
    this.cluster.master(function() {
      
      _this.Promise = require("bluebird/js/main/promise")();
      
      _this.Promise.request = _this.deferRequest.bind(_this);
      _this.Promise.prototype.request = _this.deferRequest.bind(_this);
      
      _this.Promise.prototype.exit = function(then,fail) {
        return this.then(then).catch(fail).done(function() {
          process.exit();
        });
      };
      
      _this.startWorkers();
      
    });
    
    this.cluster.start();
  }
  
});

// - -------------------------------------------------------------------- - //

module.exports = Crawler;

// - -------------------------------------------------------------------- - //
})();
