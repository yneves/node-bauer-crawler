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
  
  require: {
    
    // .require(module String) :Object
    s: function(mod) {
      if (this._baseDir && mod.indexOf(".") === 0) {
        mod = path.resolve(this._baseDir,mod);
      }
      return require(mod);
    }
  },
  
  setupConfig: {
    
    // .setupConfig(config Object) :void
    _: function(config) {
      this.config = factory.merge(config);
    },
    
    // .setupConfig(file String) :void
    s: function(file) {
      this.setupConfig(this.require(file));
    }
    
  },
  
  setupCluster: {
    
    // .setupCluster() :void
    _: function() {
      this.cluster = new Cluster();
      this.cluster.require("bauer-cluster-queue");
      this.cluster.require("bauer-cluster-super");
    },
    
    // .setupCluster(cluster Cluster) :void
    o: function(cluster) {
      if (cluster instanceof Cluster) {
        this.cluster = cluster;
      } else {
        throw new Error("Cluster expected.");
      }
    }
  },
  
  setupCrawler: {
    
    // .setupCrawler(options Object) :void
    o: function(options) {
      if (factory.isString(options.name)) {
        this.name = options.name;
      } else {
        this.name = "crawler";
      }
      
      this.loadPlugin(__dirname + "/cluster.js");
      
      if (factory.isDefined(options.plugins)) {
        this.loadPlugin(options.plugins);
      }
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
      
      this.emit("plugin",plugin);
      
      var name = plugin.name;
      if (factory.isObject(plugin.config)) {
        var config = {};
        config[name] = plugin.config;
        this.config = factory.merge(config,this.config);
      }
      
      if (factory.isDefined(plugin.promise)) {
        this.cluster.master(this.extendPromise.bind(this,plugin.promise));
      }
      
      if (factory.isDefined(plugin.master)) {
        this.cluster.master(this.wrapCallback(plugin.master));
      }
      
      if (factory.isDefined(plugin.worker)) {
        var onWorker = this.wrapCallback(plugin.worker);
        this.cluster.worker(function(worker) {
          var workerPlugin = worker.args[0].substr(this.name.length + 1);
          if (!name || name === workerPlugin) {
            onWorker(worker,this.config[workerPlugin]);
          }
        }.bind(this));
      }
    }
  },
  
  wrapCallback: {
    
    // .wrapCallback(module String) :Function
    s: function(mod) {
      return function() {
        var func = this.require(mod);
        if (factory.isFunction(func)) {
          func.apply(this,arguments);
        }
      }.bind(this);
    },
    
    // .wrapCallback(callback Function) :Function
    f: function(func) {
      return func.bind(this);
    }
  },
  
  getWorkerRoleMap: {
    
    // .getWorkerRoleMap() :Object
    0: function() {
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
    }
  },
  
  createWorkers: {
    
    // .createWorkers() :void
    0: function() {
      var _this = this;
      var roles = this.getWorkerRoleMap();
      var workers = this.cluster.superFork(roles);
      var total = workers.length;
      if (total > 0) {
        workers.forEach(function(worker) {
          worker.once("message",function(data) {
            if (data.ready) {
              if (--total === 0) {
                _this.emit("ready");
              }
            }
          });
        });
      } else {
        _this.emit("ready");
      }
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
          reject(new Error("No worker available."));
        }
      });
    }
  },
  
  createPromise: {
    
    // .createPromise() :void
    0: function() {
      if (!this.cluster.isMaster) {
        throw new Error("Promise must be created in master.");
      }
      this.Promise = require("bluebird/js/main/promise")();
    }
  },
  
  promise: {
    
    // .promise(promises Array) :Promise
    a: function(promises) {
      if (!this.cluster.isMaster) {
        throw new Error("Promise must be used in master.");
      }
      return this.Promise.all(promises).bind(this);
    },
    
    // .promise(resolver Function) :Promise
    f: function(resolver) {
      return this.promise().then(function() {
        return new this.Promise(resolver.bind(this)).bind(this);
      });
    },
    
    // .promise() :Promise
    0: function() {
      if (!this.cluster.isMaster) {
        throw new Error("Promise must be used in master.");
      }
      return this.Promise.bind(this);
    }
  },
  
  wrapPromise: {
    
    // .wrapPromise(module String) :void
    s: function(mod) {
      this.wrapPromise(this.wrapCallback(mod));
    },
    
    // .wrapPromise(callback Function) :void
    f: function(callback) {
      var ret = callback.call(this,this.promise());
      if (ret) {
        this.wrapPromise(ret,callback);
      }
    },
    
    // .wrapPromise(promise Promise, callback Function) :void
    of: function(promise,callback) {
      if (promise instanceof this.Promise) {
        
        promise.catch(function(error) {
          this.emit("error",error);
        }).then(function() {
          if (this.repeat()) {
            setImmediate(this.wrapPromise.bind(this,callback));
          } else {
            return this.promise().exit();
          }
        });
        
      } else {
        throw new Error("Promise expected.");
      }
    }
  },
  
  extendPromise: {
      
    // .extendPromise(module String) :void
    s: function(mod) {
      this.extendPromise(this.require(mod));
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
        throw new Error("Promise must be extended in master.");
      }
      this.Promise.prototype[name] = method;
    }
    
  },
  
  // .start(ready Function) :void
  start: function(ready) {
    if (factory.isDefined(ready)) {
      this.once("ready",function() {
        this.wrapPromise(ready);
      });
    }
    this.emit("start");
    this.cluster.start();
  },
  
  repeat: {
    
    // .repeat() :Boolean
    0: function() {
      return !!this._repeat;
    },
    
    // .repeat(repeat Boolean) :void
    b: function(repeat) {
      this._repeat = repeat;
    }
  }
  
});

// - -------------------------------------------------------------------- - //

module.exports = Crawler;

// - -------------------------------------------------------------------- - //
