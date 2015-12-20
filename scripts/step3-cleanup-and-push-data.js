import glob from 'glob';
import jsonfile from 'jsonfile';
import RecordCleaner from './utils/record-cleaner.js';

// We convert all files to cleaner versions
const downloadInfoboxPath = './download/infoboxes/';
let records = [];
glob(`${downloadInfoboxPath}/*.json`, (errGlob, characterFiles) => {
  if (errGlob) {
    console.info('Error in globbing', errGlob);
    return;
  }

  characterFiles.forEach((characterFile) => {
    const characterJSON = jsonfile.readFileSync(characterFile);
    let record = RecordCleaner.convert(characterJSON);
    console.info(record);
  });
});
