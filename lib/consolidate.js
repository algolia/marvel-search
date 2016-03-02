/**
 * Consolidating (ie. merging) all the data into one comprehensive set of
 * records
 **/
import _ from 'lodash';
import HelperConsolidate from './utils/helper-consolidate.js';
import HelperDBPedia from './utils/helper-dbpedia.js';
import HelperInfobox from './utils/helper-infobox.js';
import HelperJSON from './utils/helper-json.js';
import HelperMarvel from './utils/helper-marvel.js';
import HelperMarvelWebsite from './utils/helper-marvel-website.js';
import HelperPath from './utils/helper-path.js';
import HelperWikidata from './utils/helper-wikidata.js';
import HelperWikipedia from './utils/helper-wikipedia.js';

const outputDir = './records/';
const urlsFile = './download/urls/urls.json';
const imagesFile = './download/images/images.json';
const pageviewsDir = './download/pageviews';
const dbpediaDir = './download/dbpedia';
const infoboxDir = './download/infobox';
const wikidataDir = './download/wikidata';
const marvelApiDir = './download/marvel/api';
const marvelWebsiteDir = './download/marvel/website';
const recordsDir = './records/';

HelperPath.createDir(outputDir)
  .then(initCharacters)

  .then(addPageviews)
  .then(addWikidata)
  .then(addImages)

  .then(addDBpedia)
  .then(addInfobox)
  .then(addMarvelData)

  .then(consolidate)
  .then(saveToDisk)
  .then(teardown)
  ;

// Build the initial object of all character
function initCharacters() {
  console.info('Getting initial list of urls');
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
  console.info('Adding pageviews data');
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

// Adds Wikidata to each character
function addWikidata(characters) {
  console.info('Adding wikidata');
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
      };

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
  console.info('Adding images data from wikipedia');
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

// Adds DBPedia to each character
function addDBpedia(characters) {
  console.info('Adding DBPedia dump data');
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

// Fallback to infobox for characters without dbpedia data
function addInfobox(characters) {
  console.info('Adding infobox data');
  let allPromises = _.map(characters, (character, pageName) => {
    let path = `${infoboxDir}/${pageName}.json`;
    return HelperJSON.read(path).then((rawData) => {
      if (!rawData) {
        return null;
      }

      let infoboxData = HelperInfobox.getRecordData(rawData.infoboxData, pageName);

      character.infoboxData = infoboxData;
      return infoboxData;
    })
    .catch((err) => {
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

// Get all Marvel characters, from the API
function getAllMarvelApiCharacters() {
  console.info(' => Getting the list of Marvel API characters');
  return HelperPath
    .getFiles(`${marvelApiDir}/*.json`)
    .then((files) => {
      return Promise.all(_.map(files, HelperJSON.read));
    })
    .then((characters) => {
      // Remove the LEGO heroes
      return _.reject(characters, (character) => {
        return character.name.match(/LEGO Marvel/);
      });
    })
    .then((characters) => {
      // Keep only relevant data and sort by key
      return _.keyBy(_.map(characters, HelperMarvel.getRecordData), 'name');
    });
}

// Get all Marvel characters, from the website
function getAllMarvelWebsiteCharacters() {
  console.info(' => Getting the list of Marvel Website characters');
  return HelperPath
    .getFiles(`${marvelWebsiteDir}/*.html`)
    .then((files) => {
      return Promise.all(_.map(files, (file) => {
        return HelperPath.read(file).then((html) => {
          return {file, html};
        });
      }));
    })
    .then((websiteItems) => {
      console.info(`${websiteItems.length} items to parse... please wait...`);
      return _.keyBy(_.map(websiteItems, (item) => {
        let html = item.html;
        return HelperMarvelWebsite.getRecordData(html);
      }), 'name');
    })
    .catch((err) => {
      console.info(err);
    });
}

// Add Marvel data to each character
function addMarvelData(characters) {
  return Promise.all([
    getAllMarvelApiCharacters(),
    getAllMarvelWebsiteCharacters()
  ]).then((response) => {
    console.info('Adding Marvel data');
    let marvelApiCharacters = response[0];
    let marvelWebsiteCharacters = response[1];

    _.each(characters, (character) => {
      let marvelApiData = HelperConsolidate.pickDataForCharacter(character, marvelApiCharacters);
      let marvelWebsiteData = HelperConsolidate.pickDataForCharacter(character, marvelWebsiteCharacters);
      character.marvelApiData = marvelApiData;
      character.marvelWebsiteData = marvelWebsiteData;
    });

    return characters;
  });
}

// Merge all data into a coherent list of records
function consolidate(characters) {
  console.info('Consolidating into one record');
  return _.reject(_.map(characters, HelperConsolidate.merge), (character) => {
    return !character.name;
  });
}

// Save them all to disk
function saveToDisk(characters) {
  console.info('Saving to disk');
  let allPromises = _.map(characters, (character) => {
    let wikipediaUrl = HelperWikipedia.pageName(character.urls.wikipedia);
    let name = HelperPath.sanitizeFilename(wikipediaUrl);
    let filepath = `${recordsDir}${name}.json`;
    return HelperJSON.write(filepath, character).then((data) => {
      console.info(`✔ Saved ${filepath}`);
      return data;
    });
  });

  return Promise.all(allPromises);
}

function teardown(_characters) {
  console.info('Over.');
  // console.info(JSON.stringify(_characters, null, 2));
}
