/**
 * Simple templates
 */

module.exports = function(text, config) {
   text = String(text);
   config = config || {};

   Object.keys(config).forEach(function(key) {
      text = text.replace('/*[' + key + ']*/', config[key]);
   });

   return text;
};