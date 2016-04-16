/*!
**  bauer-crawler -- Multi-thread crawler engine.
**  Copyright (c) 2015 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-crawler>
*/
// - -------------------------------------------------------------------- - //

'use strict';

var bunyan = require('bunyan');

// - -------------------------------------------------------------------- - //

module.exports = function (crawler) {

  var log = bunyan.createLogger({
    src: true,
    name: crawler.name
  });

  crawler.on('error', function (error) {
    log.trace(error, 'An error happened.');
  });

  crawler.once('start', function () {
    log.trace('Crawler is starting...');
  });

  crawler.once('ready', function () {
    log.trace('Crawler is ready.');
  });

  crawler.cluster.once('master', function () {
    log.trace('Cluster master process initialized.');

    crawler.cluster.on('fork', function () {
      log.trace('Cluster master forked a new worker.');
    });
  });

  crawler.cluster.once('worker', function (worker) {
    log.trace('Cluster worker process initialized.');

    worker.on('message', function (message) {
      log.trace({ message: message }, 'Message received by worker.');
    });

    worker.on('request', function (request,response) {
      log.trace({ request: request }, 'Request received by worker.');

      response.on('send', function () {
        log.trace({ response: this.data }, 'Response sent by worker.');
      });
    });

    worker.on('exit', function () {
      log.trace('Cluster worker terminated.');
    });
  });

};

// - -------------------------------------------------------------------- - //
