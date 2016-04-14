/**
 * Download links to images taken from the Wikipedia
 **/
import Promise from 'bluebird';
import async from 'async';
import xray from 'x-ray';
import _ from 'lodash';
import HelperJSON from './utils/helper-json.js';
import HelperPath from './utils/helper-path.js';
import HelperWikipedia from './utils/helper-wikipedia.js';
let x = xray();

const outputDir = './download/images';
const outputFile = `${outputDir}/images.json`;
const urlsFile = './download/urls/urls.json';
const batchOffset = 50;
let initialUrlCount = 0;

HelperPath.createDir(outputDir)
  .then(getUrls)
  .then(getImages)
  .then(saveJSON)
  .then(teardown);

// Get the full list of urls saved on disk
function getUrls() {
  return HelperJSON.read(urlsFile).then((urls) => {
    initialUrlCount = urls.length;
    return urls;
  });
}

// Gets the image url for each Wikipedia url
function getImages(urls, batchIndex = 0, results = {}) {
  let urlCount = urls.length;

  // Out of bounds, we can return the results
  if (batchIndex > urlCount) {
    return results;
  }

  let batchLimit = batchIndex + batchOffset;
  let batchItems = urls.slice(batchIndex, batchLimit);

  let allPromises = _.map(batchItems, (url) => {
    const context = '#mw-content-text .infobox a.image';
    const selectors = ['img@src'];
    let pageName = HelperWikipedia.pageName(url);

    let deferred = Promise.pending();
    x(url, context, selectors)((err, imageUrls) => {
      if (err) {
        deferred.reject(err);
        return;
      }

      let imageUrl = imageUrls.length ? {[pageName]: imageUrls[0]} : null;
      if (imageUrl) {
        console.info(`✔ ${pageName}`);
      } else {
        console.info(`✘ ${pageName} has no image`, url);
      }
      deferred.resolve(imageUrl);
    });
    return deferred.promise;
  });

  return Promise.all(allPromises)
    .then((images) => {
      _.each(images, (image) => {
        _.merge(results, image);
      });
      return getImages(urls, batchLimit, results);
    });
}


function saveJSON(images) {
  return HelperJSON.write(outputFile, images);
}

function teardown(data) {
  let total = _.keys(data).length;
  console.info(`${total}/${initialUrlCount} image links saved`);
}
