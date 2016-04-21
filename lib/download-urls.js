/**
 * Downloads the full list of all superheroes and supervillains referenced on
 * the Wikipedia.
 * The results will be saved in batched json files
 **/
import Promise from 'bluebird';
import HelperPath from './utils/helper-path.js';
import HelperJSON from './utils/helper-json.js';
import xray from 'x-ray';
import _ from 'lodash';
let x = xray();

/* eslint-disable max-len */
const wikipediaUrlList = [
   // Heroes
  'https://en.wikipedia.org/wiki/Category:Marvel_Comics_superheroes',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_superheroes&pagefrom=Dazzler',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_superheroes&pagefrom=Jameson%0AJohn+Jameson+%28comics%29',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_superheroes&pagefrom=Prime+%28Comics%29%0APrime+%28comics%29',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_superheroes&pagefrom=Talon+%28Marvel+Comics%29',
  // Villains
  'https://en.wikipedia.org/wiki/Category:Marvel_Comics_supervillains',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_supervillains&pagefrom=Chance+%28Comics%29%0AChance+%28comics%29',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_supervillains&pagefrom=Giganto',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_supervillains&pagefrom=Locust+%28comics%29',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_supervillains&pagefrom=Paris+%28Marvel+Comics%29',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_supervillains&pagefrom=Sidewinder+%28comics%29',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_supervillains&pagefrom=Veil+%28comics%29'
];
/* eslint-enable max-len */
const urlsPath = './download/urls';
const outputFile = `${urlsPath}/urls.json`;

HelperPath.createDir(urlsPath)
  .then(getAllUrls)
  .then(rejectBadUrls)
  .then(saveUrlsOnDisk);

// Download all urls and fulfill when all are downloaded
function getAllUrls() {
  // We fetch all pages in parallel, using x-ray. We wrap the x-ray calls into
  // promises that we reject/resolve in the x-ray callback.
  let allPromises = _.map(wikipediaUrlList, (url) => {
    const context = '#mw-pages .mw-category-group li';
    const selectors = ['a@href'];

    let deferred = Promise.pending();
    x(url, context, selectors)((err, urls) => {
      if (err) {
        deferred.reject(err);
        return;
      }
      console.info(`=> ${url}`);
      deferred.resolve(urls);
    });
    return deferred.promise;
  });

  return Promise.all(allPromises);
}

// Reject from the list all urls I don't want to index
function rejectBadUrls(urls) {
  // Keep only one of each
  urls = _.uniq(_.flatten(urls)).sort();
  urls = _.reject(urls, (url) => {
    // Remove "lists of..."
    if (/wiki\/List_of_/.test(url)) {
      return true;
    }
    // Ultimate characters
    if (/wiki\/Ultimate_/.test(url)) {
      return true;
    }
    // 2099 characters
    if (/2099$/.test(url)) {
      return true;
    }
    return false;
  });
  return urls;
}

function saveUrlsOnDisk(urls) {
  console.info(`Got ${urls.length} unique urls`);
  return HelperJSON.write(outputFile, urls);
}
