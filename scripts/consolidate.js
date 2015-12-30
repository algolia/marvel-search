import async from 'async';
import forEach from 'lodash/collection/forEach';
import _ from 'lodash';
import hash from 'object-hash';
import fs from 'fs';
import glob from 'glob';
import jsonfile from 'jsonfile';
import helper from './utils/helper.js';
import RecordCleaner from './utils/record-cleaner.js';
import stringify from 'json-stable-stringify';

// CONSOLIDATE: We take infobox, image and pageviews and we build the
// records
const urlsPath = './download/step1-urls/';
const infoboxesPath = './download/step2-infoboxes/';
const imagesPath = './download/step3-images/';
const pageviewsPath = './download/step4-pageviews/';
const distPath = './records/';

// We clear all ./records/*.json
glob(`${distPath}/*.json`, (errGlob, files) => {
  let promiseList = [];
  files.forEach((file) => {
    promiseList.push((callback) => {
      fs.unlink(file, callback);
    });
  });

  async.parallel(promiseList, () => {
    console.info(`${files.length} original json deleted`);
    getAllWikipediaUrls();
  });
});

// We grab all the Wikipedia urls in a list
const getAllWikipediaUrls = () => {
  glob(`${urlsPath}/*.json`, (errGlob, files) => {
    let urlList = [];
    forEach(files, (file) => {
      urlList.push.apply(urlList, jsonfile.readFileSync(file));
    });

    console.info(`Getting all the ${urlList.length} urls`);
    getAllInfoboxes(urlList);
  });
};

// We grab all the infoboxes for those urls
const getAllInfoboxes = (urlList) => {
  let promiseList = [];
  urlList.forEach((url) => {
    let infoboxPath = helper.getJSONFilepathFromUrl(url, infoboxesPath);
    promiseList.push((callback) => {
      jsonfile.readFile(infoboxPath, (_err, data) => {
        callback(null, data);
      });
    });
  });

  async.parallel(promiseList, (_err, data) => {
    // Cleanup the list of empty elements
    data = _.compact(data);
    console.info(`Getting infoboxes for only ${data.length} existing infoboxes`);
    cleanupInfoboxes(data);
  });
};

// We create a key:value list of data based on the infoboxes
const cleanupInfoboxes = (infoboxesList) => {
  let data = {};
  infoboxesList.forEach((infoboxData) => {
    let url = infoboxData.url;
    let key = helper.getWikipediaName(url);
    let value = RecordCleaner.convert(infoboxData);
    if (!value.name) {
      value.name = helper.getCharacterNameFromUrl(url);
    }
    data[key] = value;
  });

  console.info(`Cleaning up list of infoboxes`);
  groupDuplicates(data);
};

// Group pages that are identical
const groupDuplicates = (allCharacters) => {
  let groupedCharacters = _.groupBy(allCharacters, (item) => {
    let hashedItem = _.clone(item);
    delete hashedItem.url;
    return hash.MD5(hashedItem);
  });

  groupedCharacters = _.values(groupedCharacters);


  console.info(`Found ${groupedCharacters.length} unique characters`);
  getPageViews(groupedCharacters);
};

// Add pageviews as the sum of all pageviews for duplicated
const getPageViews = (groupedCharacters) => {
  let promiseList = [];
  groupedCharacters.forEach((duplicates) => {
    promiseList.push((callback) => {
      mergeDuplicatesWithPageviews(duplicates, (data) => {
        callback(null, data);
      });
    });
  });

  async.parallel(promiseList, (_err, response) => {
    console.info(`Adding pageview count to all ${response.length} characters`);
    getImages(response);
  });
};

// Given an array of character data, will return only one, with the sum of
// pageviews
const mergeDuplicatesWithPageviews = (duplicates, finalCallback) => {
  // Building the promise list
  let promiseList = [];
  duplicates.forEach((character) => {
    let url = character.url;
    let pageviewPath = helper.getJSONFilepathFromUrl(url, pageviewsPath);
    promiseList.push((callback) => {
      jsonfile.readFile(pageviewPath, (_err, data) => {
        callback(null, data);
      });
    });
  });

  async.parallel(promiseList, (_err, data) => {
    let sum = _.sum(data, 'pageviews');
    let main = _.max(data, 'pageviews');
    let mergedData = {
      ...duplicates[0],
      url: main.url,
      pageviews: sum
    };
    finalCallback(mergedData);
  });
};

// Grab image url and dimensions and add them to the list
const getImages = (characterList) => {
  let promiseList = [];
  characterList.forEach((character) => {
    let url = character.url;
    let imagePath = helper.getJSONFilepathFromUrl(url, imagesPath);
    promiseList.push((callback) => {
      jsonfile.readFile(imagePath, (_err, data) => {
        let image = data.image;
        callback(null, {...character, image});
      });
    });
  });

  async.parallel(promiseList, (_err, data) => {
    console.info(`Adding image to all ${data.length} characters`);
    saveRecords(data);
  });
};

const saveRecords = (recordList) => {
  let promiseList = [];
  recordList.forEach((record) => {
    let url = record.url;
    let recordPath = helper.getJSONFilepathFromUrl(url, distPath);
    promiseList.push((callback) => {
      // Force JSON to order keys, so diffs are easier to read
      let stringContent = stringify(record, {space: '  '});
      fs.writeFile(recordPath, stringContent, () => {
        callback(null, recordPath);
      });
    });
  });

  async.parallel(promiseList, (_err, data) => {
    console.info(`All ${data.length} records saved to ${distPath}`);
  });
}
