/**
 * Intercepts reports content from stdout and writes it to the specified file
 */
function saveReport(fileName) {
   reporter.setFileName(fileName);
   fileName = reporter.getFilename();

   //Remove old report
   reporter.clear();

   logger.log(`Writing report file '${fileName}'`);

   //Intercept stdout by dirty hack
   let writeOriginal = process.stdout.write,
      output = [];

   process.stdout.write = chunk => {
      let str = '' + chunk;
      if (str && str[0] !== '<') {
         str = '<!--' + str + '-->';
      }
      output.push(str);
   };

   process.on('exit', () => {
      process.stdout.write = writeOriginal;
      reporter.save(output.join(''));
   });
}

module.exports = saveReport;
