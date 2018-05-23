/**
 * Simple templates parser: {{some}}
 */

module.exports = function(text, config) {
   text = String(text);
   config = config || {};

   Object.keys(config).forEach(key => {
      let pattern = '{{' + key + '}}';
      while (text.includes(pattern)) {
         text = text.replace(pattern, config[key]);
      }
   });

   return text;
};
