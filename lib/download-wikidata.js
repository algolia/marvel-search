/**
 * Download data from wikidata.
 * Wikidata holds various translations and links between pages.
 **/
import wdk from 'wikidata-sdk';
import _ from 'lodash';
import HelperJSON from './utils/helper-json.js';
import HelperPath from './utils/helper-path.js';
import HelperWikidata from './utils/helper-wikidata.js';
import HelperWikipedia from './utils/helper-wikipedia.js';

const outputDir = './download/wikidata';
const urlsFile = './download/urls/urls.json';
const batchOffset = 20;
let initialCharacterCount = 0;

HelperPath.createDir(outputDir)
  .then(getUrls)
  .then(addWikidataUrls)
  .then(saveWikidataData)
  .then(teardown);

// Get the full list of urls saved on disk
function getUrls() {
  return HelperJSON.read(urlsFile);
}

// Add the wikidata url to the list
function addWikidataUrls(urls) {
  initialCharacterCount = urls.length;
  return _.map(urls, (url) => {
    let pageName = HelperWikipedia.pageName(url);
    return {
      wikipediaUrl: url,
      wikidataUrl: wdk.getWikidataIdsFromWikipediaTitles(pageName)
    };
  });
}

// Add the content of all wikidata calls
function saveWikidataData(characters, batchIndex = 0, results = []) {
  let urlCount = characters.length;

  // Out of bounds, we can return the results
  if (batchIndex > urlCount) {
    return results;
  }

  let batchLimit = batchIndex + batchOffset;
  let batchItems = characters.slice(batchIndex, batchLimit);

  let allPromises = _.map(batchItems, (character) => {
    return HelperJSON.readUrl(character.wikidataUrl)
      .then((wikidataData) => {
        let data = {...character, wikidataData};
        let pageName = HelperWikipedia.pageName(data.wikipediaUrl);

        // Skipping characters that have no wikidata page
        if (HelperWikidata.isReceivedDataMissing(wikidataData)) {
          console.info(`✘ Wikidata data missing for ${pageName}`);
          return undefined;
        }

        let path = `${outputDir}/${pageName}.json`;
        return HelperJSON.write(path, data).then((_data) => {
          console.info(`✔ ${pageName}`);
          return _data;
        });
      });
  });

  return Promise.all(allPromises).then((data) => {
    data = _.compact(data);
    results = _.concat(results, data);
    return saveWikidataData(characters, batchLimit, results);
  });
}

function teardown(data) {
  let fileSaved = _.compact(data).length;
  console.info(`${fileSaved}/${initialCharacterCount} characters saved`);
}
