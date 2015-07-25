/*!
**  bauer-crawler -- Multi-thread crawler engine.
**  Copyright (c) 2015 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-crawler>
*/
// - -------------------------------------------------------------------- - //

"use strict";

var path = require("path");
var events = require("events");
var factory = require("bauer-factory");
var Cluster = require("bauer-cluster").Cluster;
var merge = require("lodash/object/merge");

// - -------------------------------------------------------------------- - //

var Crawler = factory.createClass({
  
  inherits: events.EventEmitter,
  
  // new Crawler(options Object) :Crawler
  constructor: function(options) {
    
    if (factory.isString(options)) {
      this._baseDir = path.dirname(options);
      options = this.require(options);
    }
    
    if (!factory.isObject(options)) {
      options = {};
    }
    
    this.setupConfig(options.config);
    this.setupCluster(options.cluster);
    this.setupCrawler(options);
  },
  
  setupConfig: {
    
    // .setupConfig(config Object) :void
    _: function(config) {
      this.config = merge({},config);
    },
    
    // .setupConfig(file String) :void
    s: function(file) {
      this.setupConfig(this.require(file));
    }
    
  },
  
  //.setupCluster(cluster Cluster) :void
  setupCluster: function(cluster) {
    if (cluster instanceof Cluster) {
      this.cluster = cluster;
    } else {
      this.cluster = new Cluster();
      this.cluster.require("bauer-cluster-queue");
      this.cluster.require("bauer-cluster-super");
    }
  },
  
  // .setupCrawler(options Object) :void
  setupCrawler: function(options) {
    options = options || {};
    
    if (factory.isString(options.name)) {
      this.name = options.name;
    } else {
      this.name = "crawler";
    }
    
    this.loadPlugin(__dirname + "/cluster.js");
    
    if (factory.isDefined(options.plugins)) {
      this.loadPlugin(options.plugins);
    }
  },
  
  loadPlugin: {
    
    // .loadPlugin(plugins Array) :void
    a: function(plugins) {
      plugins.forEach(function(plugin) {
        this.loadPlugin(plugin);
      }.bind(this));
    },
      
    // .loadPlugin(plugin String) :void
    s: function(plugin) { 
      this.loadPlugin(this.require(plugin));
    },
    
    // .loadPlugin(plugin Object) :void
    o: function(plugin) {
      
      var name = plugin.name;
      if (factory.isObject(plugin.config)) {
        var config = {};
        config[name] = plugin.config;
        this.config = merge({},config,this.config);
      }
      
      if (factory.isDefined(plugin.promise)) {
        this.cluster.master(this.extendPromise.bind(this,plugin.promise));
      }
      
      if (factory.isDefined(plugin.master)) {
        this.cluster.master(this.toFunction(plugin.master));
      }
      
      if (factory.isDefined(plugin.worker)) {
        var onWorker = this.toFunction(plugin.worker);
        this.cluster.worker(function(worker) {
          var workerPlugin = worker.args[0].substr(this.name.length + 1);
          if (!name || name === workerPlugin) {
            onWorker(worker,this.config[workerPlugin]);
          }
        }.bind(this));
      }
      
    }
  },
  
  require: {
    
    // .require(module String) :Object
    s: function(mod) {
      if (this._baseDir && mod.indexOf(".") === 0) {
        mod = path.resolve(this._baseDir,mod);
      }
      return require(mod);
    }
  },
  
  toFunction: {
    
    // .toFunction(module String) :Function
    s: function(mod) {
      return function() {
        var func = this.require(mod);
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
  
  // .getWorkerRoleMap() :Object
  getWorkerRoleMap: function() {
    var name = this.name;
    var config = this.config;
    var roles = {};
    Object.keys(this.config).forEach(function(role) {
      if (factory.isObject(config[role])) {
        if (factory.isNumber(config[role].workers)) {
          roles[name + "-" + role] = config[role].workers;
        } else {
          roles[name + "-" + role] = 1;
        }
      }
    });
    return roles;
  },
  
  // .createWorkers() :void
  createWorkers: function() {
    var _this = this;
    var roles = this.getWorkerRoleMap();
    var workers = this.cluster.superFork(roles);
    var total = workers.length;
    if (total > 0) {
      workers.forEach(function(worker) {
        worker.once("message",function(data) {
          if (data.ready) {
            if (--total === 0) {
              _this.ready();
            }
          }
        });
      });
    } else {
      _this.ready();
    }
  },
  
  requestWorker: {
    
    // .requestWorker(role String, request Object) :Promise
    so: function(role,request) {
      return this.promise(function(resolve,reject) {
        var worker = this.cluster.rotateWorker(this.name + "-" + role);
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
  
  ready: {
    
    // .ready() :void
    0: function() {
      this.emit("ready",this.promise());
    },
    
    // .ready(callback Function) :void
    f: function(callback) {
      this.once("ready",callback);
    },
    
    // .ready(module String) :void
    s: function(callback) {
      this.ready(this.toFunction(callback));
    }
      
  },
  
  // .start(ready Function) :void
  start: function(ready) {
    if (factory.isDefined(ready)) {
      this.ready(ready);
    }
    this.cluster.start();
  }
  
});

// - -------------------------------------------------------------------- - //

module.exports = Crawler;

// - -------------------------------------------------------------------- - //
