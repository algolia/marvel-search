/**
 * Download data from DBPedia.
 **/
import _ from 'lodash';
import HelperDBPedia from './utils/helper-dbpedia.js';
import HelperJSON from './utils/helper-json.js';
import HelperPath from './utils/helper-path.js';
import HelperWikipedia from './utils/helper-wikipedia.js';

const outputDir = './download/dbpedia';
const urlsFile = './download/urls/urls.json';
const batchOffset = 20;
let initialUrlCount = 0;

HelperPath.createDir(outputDir)
  .then(getUrls)
  .then(saveDBPediaData)
  .then(teardown);

// Get the full list of urls saved on disk
function getUrls() {
  return HelperJSON.read(urlsFile).then((urls) => {
    initialUrlCount = urls.length;
    return urls;
  });
}

// Save all DBPedia data to disk. Do it by batch
function saveDBPediaData(urls, batchIndex = 0, results = []) {
  let urlCount = urls.length;

  // Out of bounds, we can return the results
  if (batchIndex > urlCount) {
    return results;
  }

  let batchLimit = batchIndex + batchOffset;
  let batchItems = urls.slice(batchIndex, batchLimit);

  let allPromises = _.map(batchItems, (url) => {
    let pageName = HelperWikipedia.pageName(url);
    let dbpediaUrl = `http://dbpedia.org/data/${pageName}.json`;

    return HelperJSON.readUrl(dbpediaUrl)
      .then((dbpediaData) => {
        // Skipping redirect characters (they usually target a "full list" page)
        if (HelperDBPedia.isReceivedDataMissing(dbpediaData, pageName)) {
          console.info(`✘ ${pageName} has no DBPedia data`);
          return null;
        }

        let character = {
          wikipediaUrl: url,
          dbpediaData
        };
        let path = `${outputDir}/${pageName}.json`;
        return HelperJSON.write(path, character).then((data) => {
          console.info(`✔ ${pageName}`);
          return data;
        });
      });
  });

  return Promise.all(allPromises).then((data) => {
    data = _.compact(data);
    results = _.concat(results, data);
    return saveDBPediaData(urls, batchLimit, results);
  });
}

function teardown(data) {
  let fileSaved = _.compact(data).length;
  console.info(`${fileSaved}/${initialUrlCount} characters saved`);
}
