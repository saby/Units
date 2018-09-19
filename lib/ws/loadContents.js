let path = require('path');
let fs = require('fs');

/**
 * Loads contents.json if available
 */
function loadContents(projectRootPath) {
   let contentsPath = path.resolve(
      path.join(projectRootPath, 'contents.json')
   );

   let result;
   if (fs.existsSync(contentsPath)) {
      result = require(contentsPath);
   }

   return result;
}

module.exports = loadContents;
