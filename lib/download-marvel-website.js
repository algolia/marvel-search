/**
 * Download pages from the Marvel website
 **/
import _ from 'lodash';
import xray from 'x-ray';
import Promise from 'bluebird';
import HelperPath from './utils/helper-path.js';
import HelperJSON from './utils/helper-json.js';
import HelperMarvel from './utils/helper-marvel.js';
let x = xray();

const marvelWebsiteHtmlDir = './download/marvel/website';

HelperPath.createDir(marvelWebsiteHtmlDir)
  .then(getMarvelUrls)
  .then(downloadHTML)
  ;

// Get all urls of marvel heroes
function getMarvelUrls() {
  const url = 'http://marvel.com/characters/browse';
  const context = '.JCAZList-list';
  const selectors = ['a@href'];
  let deferred = Promise.pending();
  x(url, context, selectors)((_err, urls) => {
    deferred.resolve(urls);
  });
  return deferred.promise;
}

// Save the HTML on disk
function downloadHTML(urls, filepaths = [], from = 0) {
  let urlCount = urls.length;
  let size = 10;
  let to = Math.min(from + size, urlCount);
  let batch = urls.slice(from, to + size);

  // Stop when out of bounds
  if (from > urlCount) {
    return _.uniq(filepaths).sort();
  }

  console.info(`Downloading pages ${from}-${to} / ${urlCount}`);

  return Promise.all(_.map(batch, (url) => {
    let split = url.split('/');
    let filename = split[5].replace('.', '');
    let filepath = `${marvelWebsiteHtmlDir}/${filename}.html`;
    return HelperPath.downloadUrl(url, filepath);
  })).then((newFilepaths) => {
    filepaths = _.concat(filepaths, _.compact(newFilepaths));
    return downloadHTML(urls, filepaths, to + 1);
  });
}
