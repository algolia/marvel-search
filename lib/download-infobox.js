/**
 * Download infoboxes from Wikipedia if we cannot get data from DBPedia
 **/
import _ from 'lodash';
import path from 'path';
import HelperJSON from './utils/helper-json.js';
import HelperPath from './utils/helper-path.js';
import HelperWikipedia from './utils/helper-wikipedia.js';
import HelperInfobox from './utils/helper-infobox.js';

const infoboxDir = './download/infobox';
const dbpediaDir = './download/dbpedia';
const urlsFile = './download/urls/urls.json';

HelperPath.createDir(infoboxDir)
  .then(getUrls)
  .then(rejectKnownDBPediaData)
  .then(getInfoboxes)
  .then(saveToDisk)
  .then(teardown);

// Get the full list of urls saved on disk
function getUrls() {
  return HelperJSON.read(urlsFile);
}

// Keep only the url that gave no results on DBPedia
function rejectKnownDBPediaData(urls) {
  return HelperPath.getFiles(`${dbpediaDir}/*.json`).then((downloadedDBPediaCharacters) => {
    let urlNames = _.map(urls, HelperWikipedia.pageName);
    let dbpediaNames = _.map(downloadedDBPediaCharacters, (filepath) => {
      return path.basename(filepath, '.json');
    });
    return _.difference(urlNames, dbpediaNames);
  });
}

// Grab all the infoboxes from the webpages
function getInfoboxes(pageNames) {
  return Promise.all(_.map(pageNames, (pageName) => {
    return HelperInfobox.get(pageName).then((data) => {
      return {
        pageName,
        infoboxData: data
      };
    })
    .catch((err) => {
      console.info(`✘ No infobox found for ${pageName}`);
    });
  }));
}

// Save the downloaded infoboxes to disk
function saveToDisk(infoboxes) {
  return Promise.all(_.map(_.compact(infoboxes), (infobox) => {
    let filepath = `${infoboxDir}/${infobox.pageName}.json`;
    return HelperJSON.write(filepath, infobox);
  }));
}

function teardown(data) {
  console.info(`${data.length} infobox downloaded`);
}
