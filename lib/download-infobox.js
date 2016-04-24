/**
 * Download infoboxes from Wikipedia if we cannot get data from DBPedia
 **/
import _ from 'lodash';
import HelperJSON from './utils/helper-json.js';
import HelperPath from './utils/helper-path.js';
import HelperInfobox from './utils/helper-infobox.js';
import HelperWikipedia from './utils/helper-wikipedia.js';

const infoboxDir = './download/infobox';
const urlsFile = './download/urls/urls.json';
const batchOffset = 20;

HelperPath.createDir(infoboxDir)
  .then(getUrls)
  .then(saveInfoboxData)
  .then(teardown);

// Get the full list of urls saved on disk
function getUrls() {
  return HelperJSON.read(urlsFile);
}

// Grab all the infoboxes from the webpages
function saveInfoboxData(urls, batchIndex = 0, results = []) {
  let urlCount = urls.length;

  // Out of bounds, we can return the results
  if (batchIndex > urlCount) {
    return results;
  }

  let batchLimit = batchIndex + batchOffset;
  let batchItems = urls.slice(batchIndex, batchLimit);

  let allPromises = _.map(batchItems, (url) => {
    let pageName = HelperWikipedia.pageName(url);
    return HelperInfobox.get(pageName).then((data) => {
      return {
        pageName,
        infoboxData: data
      };
    })
    .then((infobox) => {
      let filepath = `${infoboxDir}/${infobox.pageName}.json`;
      return HelperJSON.write(filepath, infobox);
    })
    .catch(() => {
      console.info(`✘ No infobox found for ${pageName}`);
    });
  });

  return Promise.all(allPromises).then((data) => {
    results = _.concat(results, data);
    return saveInfoboxData(urls, batchLimit, results);
  });
}

function teardown(data) {
  console.info(`${data.length} infobox downloaded`);
}
