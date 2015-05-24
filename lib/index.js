/*!
**  bauer-crawler -- Multi-thread crawler engine.
**  Copyright (c) 2014 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-crawler>
*/
// - -------------------------------------------------------------------- - //

"use strict";

var factory = require("bauer-factory");

// - -------------------------------------------------------------------- - //

module.exports = function(callback) {

  cluster.worker(function(worker) {
    worker.require(__dirname + "/workers/" + worker.args[0] + ".js");
  });
  
  // only master
  cluster.master(function() {
    
    var config = require("./config.js");
    var Promise = require("bluebird/js/main/promise")();
    
    factory.extend(Promise,{
      
      exit: {
        0: function() {
          return this.done(function() {
            process.exit();
          });
        },
        f: function(then) {
          return this.then(then).exit();
        },
        ff: function(then,fail) {
          return this.then(then).catch(fail).exit();
        }
      },
      
      request: {
        so: function(role,request) {
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
        }
      },
      
      parse: function(options) { 
        if (factory.isFunction(options)) {
          options = { parser: options.toString() };
        }
        return this.then(function(value) {
          if (factory.isString(value)) {
            value = { content: value };
          }
          var request = factory.extend({},config.parser,options,value);
          return this.request("parser",request).get("output");
        }.bind(this));
      },
      
      download: function(options) { 
        return this.then(function(value) {
          if (factory.isString(value)) {
            value = { url: value };
          }
          var request = factory.extend({},config.downloader,options,value);
          return this.request("downloader",request).get("content");
        }.bind(this));
      },
      
      browse: function(options) {
        return this.then(function(value) {
          if (factory.isString(value)) {
            value = { url: value };
          }
          var request = factory.extend({},config.browser,options,value);
          return this.request("browser",request).get("content");
        }.bind(this));
      }
      
    });
    
    Promise.parse = function(value) {
      return Promise.resolve(value).parse();
    };
    
    Promise.download = function(value) {
      return Promise.resolve(value).download();
    };
    
    Promise.browse = function(value) {
      return Promise.resolve(value).browse();
    };
      
    // callback when its ready
    cluster.superFork(config.workers);
    var total = cluster.workers.length;
    cluster.workers.forEach(function(worker) {
      worker.once("message",function(data) {
        if (data.ready) {
          if (--total === 0) {
            callback(Promise);
          }
        }
      });
    });
    
  });
  
  cluster.start();
};
