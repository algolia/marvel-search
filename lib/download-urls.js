/**
 * Downloads the full list of all superheroes and supervillains referenced on
 * the Wikipedia.
 * The results will be saved in batched json files
 **/
import Promise from 'bluebird';
import async from 'async';
import helper from './utils/helper.js';
import xray from 'x-ray';
import _ from 'lodash';
let x = xray();

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
const urlsPath = './download/urls';
const outputFile = `${urlsPath}/urls.json`;

helper
  .createOutputDir(urlsPath)
  .then(downloadAllUrls)
  .then(saveUrlsOnDisk);

// Download all urls and fulfill when all are downloaded
function downloadAllUrls() {
  // We wrap xray calls into methods accepting a callback argument so we can
  // pass it to async.parallel
  let allPromises = _.map(wikipediaUrlList, (url) => {
    const context = '#mw-pages .mw-category-group li';
    const selectors = ['a@href'];
    return (callback) => {
      console.info(`=> ${url}`);
      x(url, context, selectors)(callback);
    };
  });

  // Make it work like a promise, for easy chaining
  return Promise.promisify(async.parallel)(allPromises);
}

function saveUrlsOnDisk(urls) {
  urls = _.uniq(_.flatten(urls)).sort();
  console.info(`Got ${urls.length} unique urls`);
  return helper.writeJSON(outputFile, urls);
}
