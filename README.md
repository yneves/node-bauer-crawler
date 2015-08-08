# bauer-crawler

Multi-process task runner.

## Installation

```
npm install bauer-crawler
```

## Usage

```js
var Crawler = require("bauer-crawler");

var myCrawler = new Crawler({
  
  // plugins to be loaded
  plugins: [
    "bauer-crawler-fetch",
    "bauer-crawler-scrape"
  ],
  
  // configurations for each plugin
  config: {
    fetch: {
      workers: 2,
      cache: {
        dir: "./http-cache",
        expires: "1d"
      }
    },
    scrape: {
      workers: 1,
      cache: {
        dir: "./scraper-output",
        expires: "1d"
      }
    }
  }
});

// starts the cluster application
myCrawler.start(function(promise) {
  
  // when returned promise is resolved process exits
  return promise
    .fetch("http://http-bin.org")
    .scrape({
      "a[href]": {
        urls: "attr:href"
      }
    });
});
```

## API Summary

  * `Crawler`
    * `new Crawler(options Object) :Crawler`
    * `.require(module String) :Object`
    * `.setupConfig(config Object) :void`
    * `.setupConfig(file String) :void`
    * `.setupCluster() :void`
    * `.setupCluster(cluster Cluster) :void`
    * `.setupCrawler(options Object) :void`
    * `.loadPlugin(plugins Array) :void`
    * `.loadPlugin(plugin String) :void`
    * `.loadPlugin(plugin Object) :void`
    * `.wrapCallback(module String) :Function`
    * `.wrapCallback(callback Function) :Function`
    * `.getWorkerRoleMap() :Object`
    * `.createWorkers() :void`
    * `.requestWorker(role String, request Object) :Promise`
    * `.createPromise() :void`
    * `.promise(resolver Function) :Promise`
    * `.promise() :Promise`
    * `.wrapPromise(module String) :void`
    * `.wrapPromise(callback Function) :void`
    * `.wrapPromise(promise Promise) :void`
    * `.extendPromise(module String) :void`
    * `.extendPromise(methods Object) :void`
    * `.extendPromise(name String, method Object) :void`
    * `.extendPromise(name String, method Function) :void`
    * `.start(ready Function) :void`
    * `.repeat() :Boolean`
    * `.repeat(repeat Boolean) :void`
    

  * `Response`
    * `.sendOk() :void`
    * `.sendOk(data Object) :void`
    * `.sendError(error Error) :void`


  * `Worker`
    * `.sendReady() :void`


  * `Promise`
    * `.requestWorker(role String, request Object) :Promise`
    * `.repeat() :Promise`
    * `.repeat(repeat Boolean) :Promise`
    * `.exit() :void`

## License

[MIT](./LICENSE)
