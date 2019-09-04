var global = function () {
   // tslint:disable-next-line:ban-comma-operator
   return this || (0, eval)('this');
}();

function patchDefine(require, original) {
   function patchedDefine(name, deps, callback) {
      if (deps instanceof Array) {
         deps.forEach(function(dep, index) {
            if (dep.startsWith('/cdn')) {
               dep[index] = dep.slice(1);
            }
         })
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
