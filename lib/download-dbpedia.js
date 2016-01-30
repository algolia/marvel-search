/**
 * Download data from DBPedia.
 **/
import helper from './utils/helper.js';
import _ from 'lodash';

const outputDir = './download/dbpedia';
const urlsFile = './download/urls/urls.json';
const batchOffset = 50;
let initialUrlCount = 0;

helper
  .createOutputDir(outputDir)
  .then(getUrls)
  .then(saveDBPediaData)
  .then(teardown);

// Get the full list of urls saved on disk
function getUrls() {
  return helper.readJSON(urlsFile).then((urls) => {
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
    let pageName = helper.getWikipediaPageName(url);
    let dbpediaUrl = `http://dbpedia.org/data/${pageName}.json`;

    return helper.readJSONUrl(dbpediaUrl)
      .then((dbpediaData) => {
        // Skipping redirect characters (they usually target a "full list" page)
        if (helper.isDBPediaMissing(dbpediaData, pageName)) {
          console.info(`✘ ${pageName} has no DBPedia data`);
          return null;
        }

        let character = {
          wikipediaUrl: url,
          dbpediaData
        };
        let path = `${outputDir}/${pageName}.json`;
        return helper.writeJSON(path, character).then((data) => {
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
