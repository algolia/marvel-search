/**
 * Download data from wikidata.
 * Wikidata holds various translations and links between pages.
 **/
import helper from './utils/helper.js';
import wdk from 'wikidata-sdk';
import _ from 'lodash';

const outputDir = './download/wikidata';
const urlsFile = './download/urls/urls.json';
let initialCharacterCount = 0;

helper
  .createOutputDir(outputDir)
  .then(getUrls)
  .then(addWikidataUrls)
  .then(addWikidataData)
  .then(teardown);

// Get the full list of urls saved on disk
function getUrls() {
  return helper.readJSON(urlsFile);
}

// Add the wikidata url to the list
function addWikidataUrls(urls) {
  initialCharacterCount = urls.length;
  return _.map(urls, (url) => {
    let pageName = helper.getWikipediaPageName(url);
    return {
      wikipediaUrl: url,
      wikidataUrl: wdk.getWikidataIdsFromWikipediaTitles(pageName)
    };
  });
}

// Add the content of all wikidata calls
function addWikidataData(characters) {
  let allPromises = _.map(characters, (character) => {
    return helper.readJSONUrl(character.wikidataUrl)
      .then((wikidataData) => {
        let data = {...character, wikidataData};
        let pageName = helper.getWikipediaPageName(data.wikipediaUrl);

        // Skipping characters that have no wikidata page
        if (helper.isWikidataMissing(wikidataData)) {
          console.info(`✘ ${pageName}`);
          return undefined;
        }

        let path = `${outputDir}/${pageName}.json`;
        return helper.writeJSON(path, data).then((_data) => {
          console.info(`✔ ${pageName}`);
          return _data;
        });
      });
  });

  return Promise.all(allPromises);
}

function teardown(data) {
  let fileSaved = _.compact(data).length;
  console.info(`${fileSaved}/${initialCharacterCount} characters saved`);
}
