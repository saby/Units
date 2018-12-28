/**
 * Simple templates parser: {{some}}
 */

module.exports = function(text, config) {
   text = String(text);
   config = config || {};

   Object.keys(config).forEach(key => {
      let pattern = '{{' + key + '}}';
      while (text.includes(pattern)) {
         let value = config[key];
         if (value instanceof Object) {
            let valueProto = Object.getPrototypeOf(value);
            if (valueProto === Object.prototype || valueProto === Array.prototype) {
               value = JSON.stringify(value);
            }
         }
         text = text.replace(pattern, value);
      }
   });

   return text;
};
