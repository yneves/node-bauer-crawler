/*!
**  bauer-crawler -- Multi-thread crawler engine.
**  Copyright (c) 2015 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-crawler>
*/
// - -------------------------------------------------------------------- - //

"use strict";

var factory = require("bauer-factory");

module.exports = {

  requestWorker: {
    
    // .requestWorker(role String) :Promise
    s: function(role) {
      return this.then(function(request) {
        return this.requestWorker(role,request);
      });
    },
    
    // .requestWorker(role String, request Object) :Promise
    so: function(role,request) {
      return this.then(function() {
        return this.requestWorker(role,request);
      });
    }
    
  },
  
  repeat: {
    
    // .repeat() :Promise
    0: function() {
      return this.then(function() {
        this.setRepeat(true);
      });
    },
    
    // .repeat(repeat Boolean) :Promise
    b: function(repeat) {
      return this.then(function() {
        this.setRepeat(repeat);
      });
    }
  },
  
  print: {
    
    // .print() :Promise
    0: function() {
      return this.then(function(value) {
        return this.Promise.print(value);
      });
    },
    
    // .print(text String) :Promise
    s: function(text) {
      return this.then(function() {
        process.stdout.write(text + "\n");
      });
    },
    
    // .print(array Array) :Promise
    a: function(array) {
      return this.print(JSON.stringify(array) + "\n");
    },
    
    // .print(object Object) :Promise
    o: function(object) {
      return this.print(JSON.stringify(object) + "\n");
    },
    
    // .print(anything) :Promise
    _: function(anything) {
      var text; 
      if (factory.isDefined(anything) && factory.isFunction(toString)) {
        text = anything.toString();
      } else {
        text = Object.prototype.toString.apply(anything);
      }
      return this.then(function() {
        process.stdout.write(text + "\n");
      });
    }
  },
  
  time: {
    
    // .time(callback Function) :Promise
    f: function(callback) {
      return this.then(function(value) {
        var time = process.hrtime();
        var promise = callback.call(this,value);
        return this.Promise.resolve(promise)
          .then(function() {
            var diff = process.hrtime(time);
            return diff[0] * 1e9 + diff[1];
          });
      });
    }
    
  },
  
  bauer: {
    
    // .bauer() :Promise
    0: function() {
      return this.then(function(script) {
        // TODO: load external bauer script
      });
    },
    
    // .bauer(script String) :Promise
    s: function(script) {
      return this.then(function() {
        // TODO: load external bauer script
      });
    }
  },
  
  exit: {
    
    // .exit() :Promise
    0: function() {
      return this.done(function() {
        process.exit();
      });
    }
  }
  
};

// - -------------------------------------------------------------------- - //
