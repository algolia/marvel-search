/**
 * Consolidating (ie. merging) all the data into one comprehensive set of
 * records
 **/
import HelperDBPedia from './utils/helper-dbpedia.js';
import HelperJSON from './utils/helper-json.js';
import HelperPath from './utils/helper-path.js';
import HelperWikipedia from './utils/helper-wikipedia.js';
import _ from 'lodash';

const outputDir = './records/';
const urlsFile = './download/urls/urls.json';
const pageviewsDir = './download/pageviews';
const dbpediaDir = './download/dbpedia';
const wikidataDir = './download/wikidata';

HelperPath.createDir(outputDir)
  .then(initCharacters)
  // .then(addPageviews)
  .then(addDBpedia)
  // .then(addWikidata)
  .then(teardown)
  ;

// Build the initial object of all characters
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

// Adds pageviews to each characters
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

// Adds DBPedia to each characters
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
      console.info(err);
      return null;
    });
  });

  return Promise.all(allPromises).then(() => {
    return characters;
  });
}

// Adds Wikidata to each characters
function addWikidata(characters) {
  let allPromises = _.map(characters, (character, pageName) => {
    let path = `${wikidataDir}/${pageName}.json`;
    return HelperJSON.read(path).then((wikidataData) => {
      if (!wikidataData) {
        return null;
      }
      // Update characters in place
      character.wikidataData = wikidataData.wikidataData;
      return wikidataData;
    })
    .catch(() => {
      // If file not found, set an empty data
      character.wikidataData = null;
      return null;
    });
  });

  return Promise.all(allPromises).then(() => {
    return characters;
  });
}

// Add wikipedia image link
// Add Marvel data. For each wiki link, need to find the marvel name that
// matches the most. Maybe "Marvel object"?
// Cleanup the objects to find the best possible record.
// Maybe simplifyDBPedia/simplifyMarvel, etc?
//
// Name
// Real Name
// Powers
// Descriptions
// Teams
// Authors
// Friends?

function teardown(characters) {
  console.info(JSON.stringify(characters, null, 2));
}


// import async from 'async';
// import forEach from 'lodash/collection/forEach';
// import _ from 'lodash';
// import hash from 'object-hash';
// import fs from 'fs';
// import glob from 'glob';
// import jsonfile from 'jsonfile';
// import helper from './utils/helper.js';
// import RecordCleaner from './utils/record-cleaner.js';
// import stringify from 'json-stable-stringify';
//
// // CONSOLIDATE: We take all the disparate info, and build a coherent record
// const urlsPath = './download/step1-urls/';
// const infoboxesPath = './download/step2-infoboxes/';
// const imagesPath = './download/step3-images/';
// const pageviewsPath = './download/step4-pageviews/';
// const marvelPath = './download/step5-marvel/';
// const distPath = './records/';
//
// // We clear all ./records/*.json
// glob(`${distPath}/*.json`, (errGlob, files) => {
//   let promiseList = [];
//   files.forEach((file) => {
//     promiseList.push((callback) => {
//       fs.unlink(file, callback);
//     });
//   });
//
//   async.parallel(promiseList, () => {
//     console.info(`${files.length} original json deleted`);
//     getAllWikipediaUrls();
//   });
// });
//
// // We grab all the Wikipedia urls in a list
// function getAllWikipediaUrls() {
//   glob(`${urlsPath}/*.json`, (errGlob, files) => {
//     let urlList = [];
//     forEach(files, (file) => {
//       urlList.push.apply(urlList, jsonfile.readFileSync(file));
//     });
//
//     console.info(`Getting all the ${urlList.length} urls`);
//     getAllInfoboxes(urlList);
//   });
// }
//
// // We grab all the infoboxes for those urls
// function getAllInfoboxes(urlList) {
//   let promiseList = [];
//   urlList.forEach((url) => {
//     let infoboxPath = helper.getJSONFilepathFromUrl(url, infoboxesPath);
//     promiseList.push((callback) => {
//       jsonfile.readFile(infoboxPath, (_err, data) => {
//         callback(null, data);
//       });
//     });
//   });
//
//   async.parallel(promiseList, (_err, data) => {
//     // Cleanup the list of empty elements
//     data = _.compact(data);
//     console.info(`Getting infoboxes for only ${data.length} existing infoboxes`);
//     cleanupInfoboxes(data);
//   });
// }
//
// // We create a key:value list of data based on the infoboxes
// function cleanupInfoboxes(infoboxesList) {
//   let data = {};
//   infoboxesList.forEach((infoboxData) => {
//     let url = infoboxData.url;
//     let key = helper.getWikipediaName(url);
//     let value = RecordCleaner.convert(infoboxData);
//     if (!value.name) {
//       value.name = helper.getCharacterNameFromUrl(url);
//     }
//     data[key] = value;
//   });
//
//   console.info(`Cleaning up list of infoboxes`);
//   groupDuplicates(data);
// }
//
// // Group pages that are identical
// function groupDuplicates(allCharacters) {
//   let groupedCharacters = _.groupBy(allCharacters, (item) => {
//     let hashedItem = _.clone(item);
//     delete hashedItem.url;
//     return hash.MD5(hashedItem);
//   });
//
//   groupedCharacters = _.values(groupedCharacters);
//
//   console.info(`Found ${groupedCharacters.length} unique characters`);
//   getPageViews(groupedCharacters);
// }
//
// // Add pageviews as the sum of all pageviews for duplicated
// function getPageViews(groupedCharacters) {
//   let promiseList = [];
//   groupedCharacters.forEach((duplicates) => {
//     promiseList.push((callback) => {
//       mergeDuplicatesWithPageviews(duplicates, (data) => {
//         callback(null, data);
//       });
//     });
//   });
//
//   async.parallel(promiseList, (_err, response) => {
//     console.info(`Adding pageview count to all ${response.length} characters`);
//     mergeWithMarvelData(response);
//   });
// }
//
// // Given an array of character data, will return only one, with the sum of
// // pageviews
// function mergeDuplicatesWithPageviews(duplicates, finalCallback) {
//   // Building the promise list
//   let promiseList = [];
//   duplicates.forEach((character) => {
//     let url = character.url;
//     let pageviewPath = helper.getJSONFilepathFromUrl(url, pageviewsPath);
//     promiseList.push((callback) => {
//       jsonfile.readFile(pageviewPath, (_err, data) => {
//         callback(null, data);
//       });
//     });
//   });
//
//   async.parallel(promiseList, (_err, data) => {
//     let sum = _.sum(data, 'pageviews');
//     let main = _.max(data, 'pageviews');
//     let mergedData = {
//       ...duplicates[0],
//       url: main.url,
//       pageviews: sum
//     };
//     finalCallback(mergedData);
//   });
// }
//
// // Get all the Marvel data, ordered by character name
// function getAllMarvelData(finalCallback) {
//   // Reading all files in ./step5-marvel
//   glob(`${marvelPath}/*.json`, (errGlob, files) => {
//     // Building the array of read promises
//     let promiseList = _.map(files, (file) => {
//       return (callback) => {
//         jsonfile.readFile(file, callback);
//       }
//     });
//
//     async.parallel(promiseList, (_err, characters) => {
//       // Building an object where each key is the char name and each value the
//       // interesting data
//       let marvelData = {};
//       _.each(characters, (character) => {
//         let key = helper.getMarvelKeyFromName(character.name);
//         let value = helper.getMarvelDataFromRaw(character);
//         marvelData[key] = value;
//       });
//       finalCallback(marvelData);
//     });
//   });
// }
//
// // Will find the matching character in the marvel dataset and merge it with the
// // character
// function mergeWithMarvelData(charactersList) {
//   // Grab also all Marvel chars
//   let marvelCount = 0;
//   getAllMarvelData((marvelList) => {
//     // Build a key:value object of all characters
//     let charactersHashMarvel = _.indexBy(marvelList, 'name');
//     // Build a list of all Marvel character names
//     let marvelNamesList = _.pluck(marvelList, 'name');
//     console.info('Merging with Marvel data');
//     charactersList = _.map(charactersList, (wikiData) => {
//       let matchingMarvelName = _.find(marvelNamesList, (marvelName) => {
//         return helper.isMarvelNameEqualToWikiData(marvelName, wikiData);
//       });
//       // Nothing matches, so we keep the same content
//       if (!matchingMarvelName) {
//         return wikiData;
//       }
//
//       marvelCount++;
//       // Otherwise we merge the content with the marvel data
//       let marvelData = charactersHashMarvel[matchingMarvelName];
//       wikiData.marvel = {
//         description: marvelData.description,
//         id: marvelData.id,
//         url: marvelData.url,
//         image: marvelData.image,
//         counts: marvelData.counts
//       };
//       return wikiData;
//     });
//
//     console.info(`Marvel data added to ${marvelCount} characters`);
//     getImages(charactersList);
//   });
// }
//
// // Grab image url and dimensions and add them to the list
// function getImages(characterList) {
//   // TODO: If no Marvel image (which is better), we get the Wikipedia image
//   // But we save it at the root, into "image"
//   let promiseList = [];
//   characterList.forEach((character) => {
//     let url = character.url;
//     let imagePath = helper.getJSONFilepathFromUrl(url, imagesPath);
//     promiseList.push((callback) => {
//       jsonfile.readFile(imagePath, (_err, data) => {
//         let image = data.image;
//         callback(null, {...character, image});
//       });
//     });
//   });
//
//   async.parallel(promiseList, (_err, data) => {
//     console.info(`Adding image to all ${data.length} characters`);
//     saveRecords(data);
//   });
// }
//
// function saveRecords(recordList) {
//   let promiseList = [];
//   recordList.forEach((record) => {
//     let url = record.url;
//     let recordPath = helper.getJSONFilepathFromUrl(url, distPath);
//     promiseList.push((callback) => {
//       // Force JSON to order keys, so diffs are easier to read
//       let stringContent = stringify(record, {space: '  '});
//       fs.writeFile(recordPath, stringContent, () => {
//         callback(null, recordPath);
//       });
//     });
//   });
//
//   async.parallel(promiseList, (_err, data) => {
//     console.info(`All ${data.length} records saved to ${distPath}`);
//   });
// }
