/**
 * Simple templates parser: {{some}}
 */

module.exports = function(text, config) {
   text = String(text);
   config = config || {};

   Object.keys(config).forEach(key => {
      text = text.replace('{{' + key + '}}', config[key]);
   });

   return text;
};
