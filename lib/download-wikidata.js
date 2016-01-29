/**
 * Download data from wikipedia.
 * The Wikidata exposes data in a better format that the Wikipedia.
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
          console.info(`✘ No Wikidata found for ${pageName}`);
          return undefined;
        }

        let path = `${outputDir}/${pageName}.json`;
        return helper.writeJSON(path, data);
      });
  });

  return Promise.all(allPromises);
}

function teardown(data) {
  let fileSaved = _.compact(data).length;
  console.info(`${fileSaved}/${initialCharacterCount} characters saved`);
}



// import forEach from 'lodash/collection/forEach';
// import glob from 'glob';
// import jsonfile from 'jsonfile';
// import async from 'async';
// import infobox from 'wiki-infobox';
// import helper from './utils/helper.js';

// // STEP 2: Downloading all the infoboxes
// const urlsPath = './download/step1-urls/';
// const distPath = './download/step2-infoboxes/';
// const batchOffset = 30;
// 
// // We first generate a big list of all the urls
// let urlList = [];
// glob(`${urlsPath}/*.json`, (errGlob, files) => {
//   forEach(files, (file) => {
//     urlList.push.apply(urlList, jsonfile.readFileSync(file));
//   });
//   downloadData(urlList, 0, batchOffset);
// });
// 
// const downloadData = (list, index, offset) => {
//   // Stop if all is downloaded
//   if (index > list.length) {
//     return;
//   }
//   let batchItems = list.slice(index, index + offset);
//   let batchPromises = [];
// 
//   // Build the array of promises
//   batchItems.forEach((url) => {
//     batchPromises.push((callback) => {
//       let urlName = helper.getWikipediaName(url);
//       return infobox(urlName, 'en', (errInfobox, data) => {
//         callback(null, {url, data});
//       });
//     });
//   });
// 
//   // Launch them all in parallel
//   async.parallel(batchPromises, (errParallel, responses) => {
//     if (errParallel) {
//       console.info('Error in parallel', errParallel);
//       return;
//     }
// 
//     responses.forEach((response) => {
//       if (!response.data) {
//         console.info(`⚠ Unable to get data for ${response.url}`);
//         return;
//       }
//       const filepath = helper.getJSONFilepathFromUrl(response.url, distPath);
//       helper.writeJSON(filepath, response);
//     });
// 
//     // Call the next batch
//     downloadData(list, index + offset, offset);
//   });
// };
