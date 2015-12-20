// Pull all data from the Wikipedia and stores it locally as JSON files
import URL from 'url';
import Path from 'path';
import forEach from 'lodash/collection/forEach';
import glob from 'glob';
import jsonfile from 'jsonfile';
import async from 'async';
import infobox from 'wiki-infobox';


console.info('=================STEP 2================');

// STEP 2: Downloading all the infoboxes
const downloadUrlPath = './download/urls/';
const downloadInfoboxPath = './download/infoboxes/';
const batchOffset = 30;

// We first generate a big list of all the urls
let urlList = [];
glob(`${downloadUrlPath}/*.json`, (errGlob, files) => {
  if (errGlob) {
    console.info('Error in globbing', errGlob);
    return;
  }

  forEach(files, (file) => {
    console.info(`Reading file ${file}`);
    const characterList = jsonfile.readFileSync(file);

    forEach(characterList, (character) => {
      // Cleanup the name
      let name = character.title;
      name = name.replace('(comics)', '');
      name = name.replace('(Marvel Comics)', '');
      name = name.trim();

      // Getting the name as it is in the url
      let urlName = Path.basename(URL.parse(character.url).pathname);

      urlList.push({
        url: character.url,
        urlName,
        name
      });
    });
  });


  downloadInfoboxes(urlList, 0, batchOffset);
});

const downloadInfoboxes = (list, index, offset) => {
  // Stop if all is downloaded
  if (index > list.length) {
    return;
  }
  let batchItems = list.slice(index, index + offset);
  let batchPromises = [];

  // Build the array of promises
  batchItems.forEach((item) => {
    let urlName = item.urlName;
    batchPromises.push((callback) => {
      return infobox(urlName, 'en', (errInfobox, data) => {
        if (errInfobox) {
          // Silently accept it
          errInfobox = null;
        }
        callback(errInfobox, {...item, data});
      });
    });
  });

  // Launch them all in parallel
  async.parallel(batchPromises, (errParallel, infoboxes) => {
    if (errParallel) {
      console.info('Error in parallel', errParallel);
      return;
    }

    infoboxes.forEach((infoboxDetail) => {
      const urlName = infoboxDetail.urlName;

      if (!infoboxDetail.data) {
        console.info(`⚠ Unable to get data for ${infoboxDetail.url}`);
        return;
      }

      const filepath = `${downloadInfoboxPath}${urlName}.json`;
      jsonfile.writeFile(filepath, infoboxDetail, {spaces: 2}, (errWriteFile) => {
        if (errWriteFile) {
          console.info('Error when saving file', errWriteFile);
          return;
        }
        console.info(`Saving ${urlName} to disk`);
      });
    });

    // Call the next batch
    downloadInfoboxes(list, index + offset, offset);
  });
};
