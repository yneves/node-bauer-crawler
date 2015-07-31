# bauer-crawler

Multi-process task runner and automation tool.

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

## License

[MIT](./LICENSE)
