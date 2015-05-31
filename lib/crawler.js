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
      function recurse(source,target) {
        Object.keys(source).forEach(function(key) {
          if (factory.isObject(target[key])) {
            if (factory.isObject(source[key])) {
              recurse(source[key],target[key]);
            }
          } else if (!factory.isDefined(target[key])) {
            target[key] = source[key];
          }
        });
      }
      recurse(config,this.config);
    }
  },
  
  // .require(plugin String) :void
  require: function(plugin) {
    var _this = this;
    var mod = require(plugin);
    if (factory.isObject(mod)) {
      var name = mod.name;
      if (factory.isObject(mod.config)) {
        var config = {};
        config[name] = mod.config;
        this.defaults(config);
      }
      if (factory.isFunction(mod.master)) {
        this.cluster.master(function() {
          mod.master.call(_this);
        });
      } else if (factory.isString(mod.master)) {
        this.cluster.master(function() {
          var func = require(mod.master);
          if (factory.isFunction(func)) {
            func.call(_this);
          };
        });
      }
      if (factory.isFunction(mod.worker)) {
        this.cluster.worker(function(worker) {
          if (worker.args[0] === name) {
            mod.worker.call(_this,worker);
          }
        });
      } else if (factory.isString(mod.worker)) {
        this.cluster.worker(function(worker) {
          if (worker.args[0] === name) {
            var func = require(mod.worker);
            if (factory.isFunction(func)) {
              func.call(_this,worker);
            }
          }
        });
      }
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
  
  ready: {
    
    // .ready(callback Function) :void
    f: function(callback) {
      this.once("ready",function() {
        callback.call(this,this.Promise);
      });
    },
    
    // .ready(module String) :void
    s: function(mod) {
      this.once("ready",function() {
        var func = require(mod);
        if (factory.isFunction(func)) {
          func.call(this,this.Promise);
        }
      });
    }
  },
  
  // .start() :void
  start: function() {
    this.cluster.start();
  }
  
});

// - -------------------------------------------------------------------- - //

module.exports = Crawler;

// - -------------------------------------------------------------------- - //
