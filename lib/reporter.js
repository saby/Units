/**
 * Writable stream to save report contents
 */

const Writable = require('stream').Writable;

class Reporter extends Writable {
   constructor(options) {
      super(options);
      this._contents = [];
   }

   get contents() {
      return this._contents.join('');
   }

   _write(chunk, encoding, callback) {
      let str = chunk.toString();
      if (str && str[0] !== '<') {
         str = '<!--' + str + '-->';
      }
      this._contents.push(str);

      callback();
   }
}

module.exports = Reporter;
