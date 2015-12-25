import glob from 'glob';
import jsonfile from 'jsonfile';
import RecordCleaner from './utils/record-cleaner.js';

// We convert all files to cleaner versions
const downloadInfoboxPath = './download/step2-infoboxes/';
const cleanupPath = './download/step3-cleanup/';
glob(`${downloadInfoboxPath}/*.json`, (errGlob, characterFiles) => {
  if (errGlob) {
    console.info('Error in globbing', errGlob);
    return;
  }

  characterFiles.forEach((characterFile) => {
    const characterJSON = jsonfile.readFileSync(characterFile);
    let fileName = characterJSON.urlName;
    let record = RecordCleaner.convert(characterJSON);

    const filepath = `${cleanupPath}${fileName}.json`;
    jsonfile.writeFile(filepath, record, {spaces: 2}, (errWriteFile) => {
      if (errWriteFile) {
        console.info('Error when saving file', errWriteFile);
        return;
      }
      console.info(`Saving ${fileName} to disk`);
    });
  });
});
