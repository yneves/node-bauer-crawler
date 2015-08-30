/*!
**  bauer-crawler -- Multi-thread crawler engine.
**  Copyright (c) 2015 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-crawler>
*/
// - -------------------------------------------------------------------- - //

"use strict";

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
        this.repeat(true);
      });
    },
    
    // .repeat(repeat Boolean) :Promise
    b: function(repeat) {
      return this.then(function() {
        this.repeat(repeat);
      });
    }
  },
  
  print: {
    
    // .print() :Promise
    0: function() {
      return this.then(function(value) {
        return this.promise().print(value);
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
      return this.then(function() {
        process.stdout.write(JSON.stringify(array) + "\n");
      });
    },
    
    // .print(object Object) :Promise
    o: function(object) {
      return this.then(function() {
        process.stdout.write(JSON.stringify(object) + "\n");
      });
    },
    
    // .print(anything) :Promise
    _: function(anything) {
      var text; 
      if (anything && typeof anything.toString === "function") {
        text = anything.toString();
      } else {
        text = Object.prototype.toString.apply(anything);
      }
      return this.then(function() {
        process.stdout.write(text + "\n");
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
