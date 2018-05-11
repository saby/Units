import path from 'path';
import process from 'process';
import Module from 'module';
import url from 'url';

const builtins = Module.builtinModules;
const JS_EXTENSIONS = new Set(['.js', '.esm', '.mjs']);

const baseURL = url.parse('file://');
baseURL.pathname = `${process.cwd()}/`;

export function resolve(specifier, parentModuleURL = baseURL, defaultResolve) {
   if (builtins.includes(specifier)) {
      return {
         url: specifier,
         format: 'builtin'
      };
   }

   if (/^\.{0,2}[/]/.test(specifier) !== true && !specifier.startsWith('file:')) {
      //node_modules support:
      return defaultResolve(specifier, parentModuleURL);
      //throw new Error(`imports must begin with '/', './', or '../'; '${specifier}' does not`);
   }

   const resolved = url.parse(url.resolve(parentModuleURL, specifier));
   const ext = path.extname(resolved.pathname);
   console.log(`esmLoader: resolve '${specifier}' relative to '${parentModuleURL.href||parentModuleURL}' as '${resolved.href}'`);

   if (!JS_EXTENSIONS.has(ext)) {
      if (ext) {
         throw new Error(`Cannot load file with non-JavaScript file extension ${ext}.`);
      } else {
         return defaultResolve(specifier, parentModuleURL);
      }
   }

   return {
      url: resolved.href,
      format: 'esm'
   };
}
