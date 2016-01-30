/**
 * Download links to images taken from the Wikipedia
 **/
import Promise from 'bluebird';
import async from 'async';
import helper from './utils/helper.js';
import xray from 'x-ray';
import _ from 'lodash';
let x = xray();

const outputDir = './download/images';
const outputFile = `${outputDir}/images.json`;
const urlsFile = './download/urls/urls.json';
const batchOffset = 50;
let initialUrlCount = 0;

helper
  .createOutputDir(outputDir)
  .then(getUrls)
  .then(getImages)
  .then(saveJSON)
  .then(teardown);

// Get the full list of urls saved on disk
function getUrls() {
  return helper.readJSON(urlsFile).then((urls) => {
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
    let pageName = helper.getWikipediaPageName(url);
    return (callback) => {
      x(url, context, selectors)((_err, imageUrls) => {
        let imageUrl = imageUrls.length ? {[pageName]: imageUrls[0]} : null;
        if (imageUrl) {
          console.info(`✔ ${pageName}`);
        } else {
          console.info(`✘ ${pageName} has no image`, url);
        }
        callback(_err, imageUrl);
      });
    };
  });

  return Promise.promisify(async.parallel)(allPromises)
    .then((images) => {
      _.each(images, (image) => {
        _.merge(results, image);
      });
      return getImages(urls, batchLimit, results);
    });
}


function saveJSON(images) {
  return helper.writeJSON(outputFile, images);
}

function teardown(data) {
  let total = _.keys(data).length;
  console.info(`${total}/${initialUrlCount} image links saved`);
}
