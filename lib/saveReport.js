/**
 * Intercepts reports content from stdout and writes it to the specified file
 */
let report = require('./unit').report;

const logger = console;

function saveReport(fileName) {
   report.setFileName(fileName);
   fileName = report.getFilename();

   //Remove old report
   report.clear();

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
      report.save(output.join(''));
   });
}

module.exports = saveReport;
