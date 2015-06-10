/*!
**  bauer-crawler -- Multi-thread crawler engine.
**  Copyright (c) 2015 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-crawler>
*/
// - -------------------------------------------------------------------- - //

"use strict";

var events = require("events");
var factory = require("bauer-factory");
var Cluster = require("bauer-cluster").Cluster;

// - -------------------------------------------------------------------- - //

var Crawler = factory.createClass({
  
  inherits: events.EventEmitter,
  
  // new Crawler(config Object) :Crawler
  constructor: function(config) {
    this.config = config || {};
    this.cluster = new Cluster();
    this.cluster.require("bauer-cluster-queue");
    this.cluster.require("bauer-cluster-super");
    this.require(__dirname + "/cluster.js");
  },
  
  // .defaults(config Object) :void
  defaults: {
    o: function(config) {
      var recurse = function(source,target) {
        Object.keys(source).forEach(function(key) {
          if (factory.isObject(target[key])) {
            if (factory.isObject(source[key])) {
              recurse(source[key],target[key]);
            }
          } else if (!factory.isDefined(target[key])) {
            target[key] = source[key];
          }
        });
      };
      recurse(config,this.config);
    }
  },
  
  require: {
      
    // .require(plugin String) :void
    s: function(plugin) { 
      this.require(require(plugin));
    },
    
    // .require(plugin Object) :void
    o: function(plugin) {
      var name = plugin.name;
      if (factory.isObject(plugin.config)) {
        var config = {};
        config[name] = plugin.config;
        this.defaults(config);
      }
      if (factory.isDefined(plugin.master)) {
        this.cluster.master(this.toFunction(plugin.master));
      }
      if (factory.isDefined(plugin.worker)) {
        var onWorker = this.toFunction(plugin.worker);
        this.cluster.worker(function(worker) {
          if (worker.args[0] === name) {
            onWorker(worker);
          } 
        });
      }
    }
  },
  
  toFunction: {
    
    // .toFunction(module String) :Function
    s: function(mod) {
      return function() {
        var func = require(mod);
        if (factory.isFunction(func)) {
          func.apply(this,arguments);
        }
      }.bind(this);
    },
    
    // .toFunction(callback Function) :Function
    f: function(func) {
      return func.bind(this);
    }
  },
  
  // .createWorkers() :void
  createWorkers: function() {
    var _this = this;
    var roles = {};
    var total = 0;
    Object.keys(this.config).forEach(function(role) {
      if (factory.isObject(_this.config[role])) {
        if (factory.isNumber(_this.config[role].workers)) {
          roles[role] = _this.config[role].workers;
          total += roles[role];
        } else {
          roles[role] = 1;
          total += 1;
        }
      }
    });
    this.cluster.superFork(roles).forEach(function(worker) {
      worker.once("message",function(data) {
        if (data.ready) {
          if (--total === 0) {
            _this.emit("ready");
          }
        }
      });
    });
  },
  
  requestWorker: {
    
    // .requestWorker(role String, request Object) :Promise
    so: function(role,request) {
      return this.promise(function(resolve,reject) {
        var worker = this.cluster.rotateWorker(role);
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
  
  promise: {
    
    // .promise(resolver Function) :Promise
    f: function(resolver) {
      return this.promise().then(function() {
        return new this.Promise(resolver.bind(this)).bind(this);
      });
    },
    
    // .promise() :Promise
    0: function() {
      if (!this.cluster.isMaster) {
        throw new Error("not master");
      }
      if (!this.Promise) {
        this.Promise = require("bluebird/js/main/promise")();
      }
      return this.Promise.bind(this);
    }
  },
  
  extendPromise: {
      
    s: function(mod) {
      this.extendPromise(require(mod));
    },
    
    // .extendPromise(methods Object) :void
    o: function(methods) {
      Object.keys(methods).forEach(function(name) {
        this.extendPromise(name,methods[name]);
      }.bind(this));
    },
    
    // .extendPromise(name String, method Object) :void
    so: function(name,method) {
      this.extendPromise(name,factory.createMethod(method));
    },
    
    // .extendPromise(name String, method Function) :void
    sf: function(name,method) {
      if (!this.cluster.isMaster) {
        throw new Error("not master");
      }
      if (!this.Promise) {
        this.Promise = require("bluebird/js/main/promise")();
      }
      this.Promise.prototype[name] = method;
    }
    
  },
  
  // .ready(callback Function) :void
  ready: function(callback) {
    this.once("ready",this.toFunction(callback));
  },
  
  // .start() :void
  start: function() {
    this.cluster.start();
  }
  
});

// - -------------------------------------------------------------------- - //

module.exports = Crawler;

// - -------------------------------------------------------------------- - //
