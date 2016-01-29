import async from 'async';
import forEach from 'lodash/collection/forEach';
import glob from 'glob';
import helper from './utils/helper.js';
import jsonfile from 'jsonfile';
import reduce from 'lodash/collection/reduce';
import request from 'request';
import values from 'lodash/object/values';

// STEP 4: Download pageviews data for latest 90 days
const urlsPath = './download/step1-urls/';
const distPath = './download/step4-pageviews/';
const batchOffset = 10;

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
      const pageName = helper.getWikipediaName(url);
      const statsUrl = `http://stats.grok.se/json/en/latest90/${pageName}`;

      request(statsUrl, (err, response, body) => {
        let pageviews = 0;
        if (!err && response.statusCode === 200) {
          let dailyViews = JSON.parse(body).daily_views;
          pageviews = reduce(values(dailyViews), (total, n) => {
            return total + n;
          });
        }

        callback(null, {url, pageviews});
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
      if (!response.pageviews) {
        console.info(`⚠ Unable to get pageviews for ${response.url}`);
        return;
      }
      const filepath = helper.getJSONFilepathFromUrl(response.url, distPath);
      helper.writeJSON(filepath, response);
    });

    // Call the next batch
    downloadData(list, index + offset, offset);
  });
};
