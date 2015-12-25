import path from 'path';
import async from 'async';
import forEach from 'lodash/collection/forEach';
import glob from 'glob';
import jsonfile from 'jsonfile';
import xray from 'x-ray';
let x = xray();

// STEP 4: Consolidate the list of records to add url of images
const cleanupPath = './download/step3-cleanup/';
const consolidateImagesPath = './download/step4-consolidate-images/';
const batchOffset = 10;

// Get the list of all urls
let records = [];
glob(`${cleanupPath}/*.json`, (errGlob, files) => {
  forEach(files, (filepath) => {
    const file = jsonfile.readFileSync(filepath);

    records.push({
      url: file.url,
      basename: path.basename(filepath),
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
    let url = item.url;
    batchPromises.push((callback) => {
      const context = '#mw-content-text a.image';
      const selectors = [{
        url: 'img@src',
        width: 'img@width',
        height: 'img@height'
      }];

      x(url, context, selectors)((errXray, data) => {
        if (errXray) {
          console.info('Error in XRay', errXray);
          errXray = undefined;
        }

        callback(errXray, {...item, imageData: data[0]});
      });
    });
  });

  // Launch them all in parallel
  async.parallel(batchPromises, (errParallel, images) => {
    if (errParallel) {
      console.info('Error in parallel', errParallel);
      return;
    }

    images.forEach((imageDetail) => {
      if (!imageDetail.imageData) {
        console.info(`⚠ Unable to get image for ${imageDetail.url}`);
      }

      const readFilepath = imageDetail.filepath;
      const writeFilepath = `${consolidateImagesPath}${imageDetail.basename}`;

      // Adding image data to initial data
      let data = jsonfile.readFileSync(readFilepath);
      data.image = imageDetail.imageData || {};

      // Writing it
      jsonfile.writeFile(writeFilepath, data, {spaces: 2}, (errWriteFile) => {
        if (errWriteFile) {
          console.info('Error when saving file', errWriteFile);
          return;
        }
        console.info(`Saving ${writeFilepath} to disk`);
      });
    });

    // Call the next batch
    consolidateRecords(list, index + offset, offset);
  });
};
