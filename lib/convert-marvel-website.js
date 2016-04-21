/**
 * Convert Marvel HTML to JSON
 **/
import _ from 'lodash';
import path from 'path';
import HelperJSON from './utils/helper-json.js';
import HelperMarvelWebsite from './utils/helper-marvel-website.js';
import HelperPath from './utils/helper-path.js';

const inputDir = './download/marvel/html';
const outputDir = './download/marvel/json';

HelperPath.createDir(outputDir)
  .then(getMarvelFilepaths)
  .then(getMarvelData)
  .then(saveToDisk)
  .then(teardown)
  ;

function getMarvelFilepaths() {
  return HelperPath.getFiles(`${inputDir}/*.html`);
}

function getMarvelData(files) {
  return Promise.all(_.map(files, (file) => {
    return HelperPath.read(file).then((html) => {
      return {
        file,
        data: HelperMarvelWebsite.getRecordData(html)
      };
    });
  }));
}

function saveToDisk(dataList) {
  return Promise.all(_.map(dataList, (dataItem) => {
    let dirname = path.dirname(path.dirname(dataItem.file));
    let basename = `${path.basename(dataItem.file, '.html')}.json`;
    let filepath = `${dirname}/json/${basename}`;
    return HelperJSON.write(filepath, dataItem.data).then((data) => {
      console.info(`✔ Saved ${filepath}`);
      return data;
    });
  }));
}

function teardown(data) {
  let fileSaved = _.compact(data).length;
  console.info(`${fileSaved} characters saved`);
}
