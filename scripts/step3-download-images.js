import async from 'async';
import forEach from 'lodash/collection/forEach';
import glob from 'glob';
import jsonfile from 'jsonfile';
import xray from 'x-ray';
import helper from './utils/helper.js';
let x = xray();

// STEP 3: Download the list of all images
const urlsPath = './download/step1-urls/';
const distPath = './download/step3-images/';
const batchOffset = 30;

// We first generate a big list of all the urls
let urlList = [];
glob(`${urlsPath}/*.json`, (errGlob, files) => {
  forEach(files, (file) => {
    urlList.push.apply(urlList, jsonfile.readFileSync(file));
  });
  downloadData(urlList, 0, batchOffset);
});

const downloadData = (list, index, offset) => {
  // Stop if all is downloaded
  if (index > list.length) {
    return;
  }
  let batchItems = list.slice(index, index + offset);
  let batchPromises = [];

  // Build the array of promises
  batchItems.forEach((url) => {
    batchPromises.push((callback) => {
      const context = '#mw-content-text a.image';
      const selectors = {
        url: 'img@src',
        width: 'img@width',
        height: 'img@height'
      };

      x(url, context, selectors)((errXray, data) => {
        callback(null, {url, image: data});
      });
    });
  });

  // Launch them all in parallel
  async.parallel(batchPromises, (errParallel, responses) => {
    if (errParallel) {
      console.info('Error in parallel', errParallel);
      return;
    }

    responses.forEach((response) => {
      if (!response.image) {
        console.info(`⚠ Unable to get image for ${response.url}`);
        return;
      }
      const filepath = helper.getJSONFilepathFromUrl(response.url, distPath);
      helper.writeJSON(filepath, response);
    });

    // Call the next batch
    downloadData(list, index + offset, offset);
  });
};
