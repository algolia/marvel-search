/**
 * Consolidating (ie. merging) all the data into one comprehensive set of
 * records
 **/
import HelperDBPedia from './utils/helper-dbpedia.js';
import HelperMarvel from './utils/helper-marvel.js';
import HelperJSON from './utils/helper-json.js';
import HelperPath from './utils/helper-path.js';
import HelperWikipedia from './utils/helper-wikipedia.js';
import HelperWikidata from './utils/helper-wikidata.js';
import HelperConsolidate from './utils/helper-consolidate.js';
import _ from 'lodash';

const outputDir = './records/';
const urlsFile = './download/urls/urls.json';
const imagesFile = './download/images/images.json';
const pageviewsDir = './download/pageviews';
const dbpediaDir = './download/dbpedia';
const wikidataDir = './download/wikidata';
const marvelDir = './download/marvel';
const recordsDir = './records/';

HelperPath.createDir(outputDir)
  .then(initCharacters)
  .then(addPageviews)
  .then(addDBpedia)
  .then(addWikidata)
  .then(addImages)
  .then(addMarvelData)
  .then(consolidate)
  .then(saveToDisk)
  .then(teardown)
  ;

// Build the initial object of all character
function initCharacters() {
  return HelperJSON.read(urlsFile).then((urls) => {
    let characters = {};
    _.each(urls, (url) => {
      let name = HelperWikipedia.pageName(url);
      characters[name] = {
        wikipediaUrl: url
      };
    });
    return characters;
  });
}

// Adds pageviews to each character
function addPageviews(characters) {
  let allPromises = _.map(characters, (character, pageName) => {
    let path = `${pageviewsDir}/${pageName}.json`;
    return HelperJSON.read(path).then((pageviewData) => {
      // Update characters in place
      character.pageviews = pageviewData.pageviews;
      return pageviewData;
    });
  });

  return Promise.all(allPromises).then(() => {
    return characters;
  });
}

// Adds DBPedia to each character
function addDBpedia(characters) {
  let allPromises = _.map(characters, (character, pageName) => {
    let path = `${dbpediaDir}/${pageName}.json`;
    return HelperJSON.read(path).then((rawData) => {
      if (!rawData) {
        return null;
      }

      let dbpediaData = HelperDBPedia.getRecordData(pageName, rawData.dbpediaData);

      // Update characters in place
      character.dbpediaData = dbpediaData;
      return dbpediaData;
    })
    .catch((err) => {
      // If file not found, set an empty data
      character.dbpediaData = null;

      // Silently skipping DBPedia data not found
      if (_.get(err, 'cause.code') === 'ENOENT') {
        return null;
      }
      console.info(`✘ Error with ${pageName}`, err);
      process.exit(1);
    });
  });

  return Promise.all(allPromises).then(() => {
    return characters;
  });
}

// Adds Wikidata to each character
function addWikidata(characters) {
  let allPromises = _.map(characters, (character, pageName) => {
    let path = `${wikidataDir}/${pageName}.json`;
    return HelperJSON.read(path).then((readData) => {
      if (!readData.wikidataData) {
        return null;
      }

      // Update characters in place
      let wikidataData = readData.wikidataData;
      character.wikidataData = {
        aliases: HelperWikidata.getAliases(wikidataData)
      }

      return wikidataData;
    })
    .catch((err) => {
      // If file not found, set an empty data
      character.wikidataData = null;

      if (_.get(err, 'cause.code') === 'ENOENT') {
        return null;
      }
      console.info(`✘ Error with ${pageName}`, err);
      process.exit(1);
    });
  });

  return Promise.all(allPromises).then(() => {
    return characters;
  });
}

// Adds wikipedia image link to each character
function addImages(characters) {
  return HelperJSON.read(imagesFile).then((images) => {
    _.each(images, (value, key) => {
      if (!_.has(characters, key)) {
        return;
      }
      characters[key].imageData = {
        url: value
      };
    });
    return characters;
  });
}

// Get all Marvel characters, sorted by name
function getAllMarvelCharacters() {
  return HelperPath
    .getFiles(`${marvelDir}/*.json`)
    .then((files) => {
      return Promise.all(_.map(files, HelperJSON.read));
    })
    .then((characters) => {
      // Keep only relevant data and sort by key
      return _.keyBy(_.map(characters, HelperMarvel.getRecordData), 'name');
    });
}

// Add Marvel data to each character
function addMarvelData(characters) {
  return getAllMarvelCharacters().then((marvelCharacters) => {
    _.each(characters, (character) => {
      let marvelData = HelperMarvel.pickDataForCharacter(character, marvelCharacters);
      if (!marvelData) {
        let guessedName = _.get(character, 'dbpediaData.name') || character.wikipediaUrl;
        // console.info(`✘ Unable to find any Marvel data for ${guessedName}`);
      } else {
        character.marvelData = marvelData;
      }
    });
    return characters;
  });
}

// Merge all data into a coherent list of records
function consolidate(characters) {
  return _.reject(_.map(characters, HelperConsolidate.merge), (character) => {
    if (!character.name) {
      console.info(character);
    }
    return !character.name;
  });
}

// Save them all to disk
function saveToDisk(characters) {
  let allPromises = _.map(characters, (character) => {
    let name = HelperPath.sanitizeFilename(character.name);
    let filepath = `${recordsDir}${name}.json`;
    return HelperJSON.write(filepath, character).then((data) => {
      console.info(`✔ Saved ${filepath}`);
      return data;
    });
  });

  return Promise.all(allPromises);
}

function teardown(characters) {
  // console.info(JSON.stringify(characters, null, 2));
}
