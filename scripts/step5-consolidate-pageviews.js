import path from 'path';
import async from 'async';
import forEach from 'lodash/collection/forEach';
import reduce from 'lodash/collection/reduce';
import values from 'lodash/object/values';
import glob from 'glob';
import jsonfile from 'jsonfile';
import request from 'request';

// STEP 5: Consolidate the records with the popularity as pageviews
const step4Path = './download/step4-consolidate-images/';
const step5Path = './download/step5-consolidate-pageviews/';
const batchOffset = 10;

// Get the list of all urls
let records = [];
glob(`${step4Path}/*.json`, (errGlob, files) => {
  forEach(files, (filepath) => {
    records.push({
      name: path.basename(filepath).slice(0, -5),
      filepath
    });
  });

  consolidateRecords(records, 0, batchOffset);
});


const consolidateRecords = (list, index, offset) => {
  // Stop if all is downloaded
  if (index > list.length) {
    return;
  }
  let batchItems = list.slice(index, index + offset);
  let batchPromises = [];

  // Build the array of promises
  batchItems.forEach((item) => {
    let pageName = item.name;

    batchPromises.push((callback) => {
      const url = `http://stats.grok.se/json/en/latest90/${pageName}`;
      request(url, (err, response, body) => {
        let sum = 0;
        if (!err && response.statusCode === 200) {
          let dailyViews = JSON.parse(body).daily_views;
          sum = reduce(values(dailyViews), (total, n) => {
            return total + n;
          });
        }

        callback(err, {...item, pageviews: sum});
      });
    });
  });

  // Launch them all in parallel
  async.parallel(batchPromises, (errParallel, pageviews) => {
    if (errParallel) {
      console.info('Error in parallel', errParallel);
      return;
    }

    pageviews.forEach((pageviewData) => {
      const readFilepath = `${step4Path}${pageviewData.name}.json`;
      const writeFilepath = `${step5Path}${pageviewData.name}.json`;

      // Adding pageview data to initial data
      let data = jsonfile.readFileSync(readFilepath);
      data.pageviews = pageviewData.pageviews;

      // Writing it
      jsonfile.writeFile(writeFilepath, data, {spaces: 2}, (errWriteFile) => {
        if (errWriteFile) {
          console.info('Error when saving file', errWriteFile);
          return;
        }
        console.info(`Saving ${writeFilepath} to disk (${data.pageviews})`);
      });
    });

    // Call the next batch
    consolidateRecords(list, index + offset, offset);
  });
};
