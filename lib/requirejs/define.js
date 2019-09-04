var global = function () {
   // tslint:disable-next-line:ban-comma-operator
   return this || (0, eval)('this');
}();

function parseModuleName(name) {
   if (name.includes('!') || name.includes('?')) {
      const lastPlugin = name.indexOf('!');
      const lastPluginOption = name.indexOf('?');
      const lastIndex = lastPlugin > lastPluginOption ? lastPlugin : lastPluginOption;

      return {
         name: name.slice(lastIndex + 1),
         plugins: name.slice(0, lastIndex + 1)
      }
   }

   return {
      name: name,
      plugins: ''
   };
}

function patchDefine(require, original) {
   function patchedDefine(name, deps, callback) {
      if (deps instanceof Array) {
         deps.forEach(function(dep, index) {
            if (dep.includes('/cdn/')) {
               const module = parseModuleName(dep);

               if (module.name.startsWith('/cdn')) {
                  deps[index] = module.plugins + module.name.slice(1);
               }
            }
         });
      }

      // Call original define() function
      return original.call(this, name, deps, callback);
   }

   patchedDefine.amd = original.amd;

   return patchedDefine;
}

// Patch define() function
if (global.define) {
   global.requirejsVars.define = global.define = patchDefine(global.requirejs, global.define);
}
