/*!
**  bauer-crawler -- Multi-thread crawler engine.
**  Copyright (c) 2015 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-crawler>
*/
// - -------------------------------------------------------------------- - //

'use strict';

var path = require('path');
var events = require('events');
var factory = require('bauer-factory');
var Cluster = require('bauer-cluster').Cluster;

// - -------------------------------------------------------------------- - //

var Crawler = factory.createClass({

  inherits: events.EventEmitter,

  // new Crawler(options Object) :Crawler
  constructor: function (options) {

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
    s: function (mod) {
      if (this._baseDir && mod.indexOf('.') === 0) {
        mod = path.resolve(this._baseDir, mod);
      }
      return require(mod);
    }
  },

  setupConfig: {

    // .setupConfig(config Object) :void
    _: function (config) {
      this.config = factory.merge(config);
    },

    // .setupConfig(file String) :void
    s: function (file) {
      this.setupConfig(this.require(file));
    }

  },

  setupCluster: {

    // .setupCluster() :void
    _: function () {
      this.cluster = new Cluster();
      this.cluster.require('bauer-cluster-queue');
      this.cluster.require('bauer-cluster-super');
    },

    // .setupCluster(cluster Cluster) :void
    o: function (cluster) {
      if (cluster instanceof Cluster) {
        this.cluster = cluster;
      } else {
        throw new Error('Cluster expected.');
      }
    }
  },

  setupCrawler: {

    // .setupCrawler(options Object) :void
    o: function (options) {

      if (factory.isString(options.name)) {
        this.name = options.name;
      } else {
        this.name = 'crawler';
      }

      if (factory.isDefined(options.main)) {
        this.once('ready', function () {
          this.wrapPromise(options.main);
        });
      }

      this.loadPlugin(__dirname + '/cluster.js');

      if (factory.isDefined(options.plugins)) {
        this.loadPlugin(options.plugins);
      }
    }
  },

  loadPlugin: {

    // .loadPlugin(plugins Array) :void
    a: function (plugins) {
      plugins.forEach(function (plugin) {
        this.loadPlugin(plugin);
      }.bind(this));
    },

    // .loadPlugin(plugin String) :void
    s: function (plugin) {
      this.loadPlugin(this.require(plugin));
    },

    // .loadPlugin(plugin Object) :void
    o: function (plugin) {

      this.emit('plugin', plugin);

      var name = plugin.name;
      if (factory.isObject(plugin.config)) {
        var config = {};
        config[name] = plugin.config;
        this.config = factory.merge(this.config, config);
      }

      if (factory.isDefined(plugin.promise)) {
        this.cluster.master(function () {
          if (factory.isString(plugin.promise)) {
            this.Promise.extend(this.require(plugin.promise));
          } else {
            this.Promise.extend(plugin.promise);
          }
        }.bind(this));
      }

      if (factory.isDefined(plugin.master)) {
        this.cluster.master(this.wrapCallback(plugin.master));
      }

      if (factory.isDefined(plugin.worker)) {
        var onWorker = this.wrapCallback(plugin.worker);
        this.cluster.worker(function (worker) {
          var workerPlugin = worker.args[0].substr(this.name.length + 1);
          if (!name || name === workerPlugin) {
            onWorker(worker, this.config[workerPlugin]);
          }
        }.bind(this));
      }
    }
  },

  wrapCallback: {

    // .wrapCallback(module String) :Function
    s: function (mod) {
      return function () {
        var func = this.require(mod);
        if (factory.isFunction(func)) {
          func.apply(this, arguments);
        }
      }.bind(this);
    },

    // .wrapCallback(callback Function) :Function
    f: function (func) {
      return func.bind(this);
    }
  },

  getWorkerRoleMap: {

    // .getWorkerRoleMap() :Object
    0: function () {
      var name = this.name;
      var config = this.config;
      var roles = {};
      Object.keys(this.config).forEach(function (role) {
        if (factory.isObject(config[role])) {
          if (factory.isNumber(config[role].workers)) {
            roles[name + '-' + role] = config[role].workers;
          } else {
            roles[name + '-' + role] = 1;
          }
        }
      });
      return roles;
    }
  },

  createWorkers: {

    // .createWorkers() :void
    0: function () {
      var _this = this;
      var roles = this.getWorkerRoleMap();
      var workers = this.cluster.superFork(roles);
      var total = workers.length;
      if (total > 0) {
        workers.forEach(function (worker) {
          worker.once('message', function (data) {
            if (data.ready) {
              if (--total === 0) {
                _this.emit('ready');
              }
            }
          });
        });
      } else {
        _this.emit('ready');
      }
    }
  },

  requestWorker: {

    // .requestWorker(role String, request Object) :Promise
    so: function (role,request) {
      return new this.Promise(function (resolve,reject) {
        var worker = this.cluster.rotateWorker(this.name + '-' + role);
        if (worker) {
          worker.request(request, function (response) {
            if (response.ok) {
              resolve(response);
            } else {
              reject(new Error(response.error));
            }
          });
        } else {
          reject(new Error('No worker available.'));
        }
      }.bind(this));
    }
  },

  wrapPromise: {

    // .wrapPromise(module String) :void
    s: function (mod) {
      this.wrapPromise(this.wrapCallback(mod));
    },

    // .wrapPromise(callback Function) :void
    f: function (callback) {
      var ret = callback.call(this, this.Promise);
      if (ret) {
        this.wrapPromise(ret, callback);
      }
    },

    // .wrapPromise(promise Promise, callback Function) :void
    of: function (promise,callback) {
      if (promise instanceof this.Promise) {

        promise.catch(function (error) {
          this.emit('error', error);
        }.bind(this)).then(function () {
          if (this.repeat === true) {
            setImmediate(this.wrapPromise.bind(this, callback));
          } else {
            return this.Promise.exit();
          }
        }.bind(this));

      } else {
        throw new Error('Promise expected.');
      }
    }
  },

  // .start(main Function) :void
  start: function (main) {
    if (factory.isDefined(main)) {
      this.once('ready', function () {
        this.wrapPromise(main);
      });
    }
    this.emit('start');
    this.cluster.start();
  },

  setRepeat: {

    // .setRepeat(repeat Boolean) :void
    b: function (repeat) {
      this.repeat = repeat;
    }
  }

});

// - -------------------------------------------------------------------- - //

module.exports = Crawler;

// - -------------------------------------------------------------------- - //
