const path = require('path');

function removeFileExtension(path) {
   return path.slice(0, path.lastIndexOf('.'));
}

function findUIModulePath(roots, fullPath) {
   for (let index = 0; index < roots.length; ++index) {
      const root = roots[index];
      if (!fullPath.startsWith(root)) {
         continue;
      }
      const startIndex = root.lastIndexOf(path.sep);
      return removeFileExtension(fullPath.slice(startIndex + 1));
   }
}

function prepareUIModulePath(config, fullPath) {
   const testModule = findUIModulePath(config.roots, fullPath);
   if (testModule) {
      return testModule;
   }
   const uiModule = findUIModulePath(config.moduleDirectories, fullPath);
   if (uiModule) {
      return uiModule;
   }
   return fullPath;
}

function process(source, fileName, config, options) {
   return `
   global.requirejs('${prepareUIModulePath(config, fileName)}');
   `;
}


module.exports = {
   process
};
