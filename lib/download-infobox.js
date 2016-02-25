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

HelperPath.createDir(infoboxDir)
  .then(getUrls)
  .then(getInfoboxes)
  .then(saveToDisk)
  .then(teardown);

// Get the full list of urls saved on disk
function getUrls() {
  return HelperJSON.read(urlsFile);
}

// Grab all the infoboxes from the webpages
function getInfoboxes(urls) {
  return Promise.all(_.map(urls, (url) => {
    let pageName = HelperWikipedia.pageName(url);
    return HelperInfobox.get(pageName).then((data) => {
      return {
        pageName,
        infoboxData: data
      };
    })
    .catch(() => {
      console.info(`✘ No infobox found for ${pageName}`);
    });
  }));
}

// Save the downloaded infoboxes to disk
function saveToDisk(infoboxes) {
  return Promise.all(_.map(_.compact(infoboxes), (infobox) => {
    let filepath = `${infoboxDir}/${infobox.pageName}.json`;
    return HelperJSON.write(filepath, infobox);
  }));
}

function teardown(data) {
  console.info(`${data.length} infobox downloaded`);
}
