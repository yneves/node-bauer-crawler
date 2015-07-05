// - -------------------------------------------------------------------- - //

"use strict";

var Crawler = require("../../");

var crawler = new Crawler({
  
  name: "sample",
  
  require: [
    __dirname + "/../../../node-bauer-crawler-fetch",
    __dirname + "/../../../node-bauer-crawler-scrape",
  ],
  
  config: {
    
    fetch: {
      workers: 2,
      slots: 2,
      delay: 100
    },
    
    scrape: {
      workers: 4,
      slots: 4,
      delay: 500
    },
    
  }
  
});

crawler.start(function() {
  
  console.log('ready');
  this.promise()
    .fetch("http://httpbin.org/get?a=b")
    .then(function(file) {
      console.log(file);
    })
    .exit();
    
});

// - -------------------------------------------------------------------- - //
