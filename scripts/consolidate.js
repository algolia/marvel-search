import async from 'async';
import forEach from 'lodash/collection/forEach';
import fs from 'fs';
import glob from 'glob';
import jsonfile from 'jsonfile';
import helper from './utils/helper.js';
import RecordCleaner from './utils/record-cleaner.js';

// CONSOLIDATE: We take infobox, image and pageviews and we build the
// records
const urlsPath = './download/step1-urls/';
const infoboxesPath = './download/step2-infoboxes/';
const imagesPath = './download/step3-images/';
const pageviewsPath = './download/step4-pageviews/';
const distPath = './records/';

// We first generate a big list of all the urls
let urlList = [];
glob(`${urlsPath}/*.json`, (errGlob, files) => {
  forEach(files, (file) => {
    urlList.push.apply(urlList, jsonfile.readFileSync(file));
  });

  forEach(urlList, (url) => {
    let infoboxPath = helper.getJSONFilepathFromUrl(url, infoboxesPath);
    if (!fs.existsSync(infoboxPath)) {
      console.info(`⚠ Skipping ${url}, no data found`);
      return;
    }
    let imagePath = helper.getJSONFilepathFromUrl(url, imagesPath);
    let pageviewPath = helper.getJSONFilepathFromUrl(url, pageviewsPath);

    async.parallel([
      (callback) => { jsonfile.readFile(infoboxPath, callback); },
      (callback) => { jsonfile.readFile(imagePath, callback); },
      (callback) => { jsonfile.readFile(pageviewPath, callback); }
    ], (err, parallelData) => {
      if (err) {
        console.info('Error in parallel', err);
      }
      // Merge all data into one object
      let infoboxData = RecordCleaner.convert(parallelData[0]);
      let image = parallelData[1].image;
      let pageviews = parallelData[2].pageviews;

      let data = {
        ...infoboxData,
        url,
        image,
        pageviews
      };

      if (!data.name) {
        data.name = helper.getCharacterNameFromUrl(url);
      }


      const filepath = helper.getJSONFilepathFromUrl(url, distPath);
      helper.writeJSON(filepath, data);
    });
  });
});
