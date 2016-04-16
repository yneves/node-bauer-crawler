/*!
**  bauer-crawler -- Multi-thread crawler engine.
**  Copyright (c) 2015 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-crawler>
*/
// - -------------------------------------------------------------------- - //

'use strict';

module.exports = {

  sendError: {

    // .sendError(error Error) :void
    e: function (error) {
        var message = 'ERROR';
        if (error.code) {
          message += ' - ' + error.code;
        }
        if (error.message) {
          message += ' - ' + error.message.toString();
        }
        if (error.stack) {
          message += ' - ' + error.stack.toString();
        }
        this.send({
          ok: false,
          error: message
        });
      }
  },

  sendOk: {

    // .sendOk() :void
    0: function () {
        this.send({ ok: true });
      },

    // .sendOk(data Object) :void
    o: function (data) {
        data.ok = true;
        this.send(data);
      }
  }

};

// - -------------------------------------------------------------------- - //
