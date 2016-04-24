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

const wikipediaCategories = [
  'Marvel_Comics_superheroes',
  'Marvel_Comics_supervillains'
];
const urlsPath = './download/urls';
const outputFile = `${urlsPath}/urls.json`;

HelperPath.createDir(urlsPath)
  .then(getSubcategoriesUrls)
  .then(getPageUrls)
  .then(rejectBadUrls)
  .then(saveUrlsOnDisk)
  ;

// Some characters are not in the complete list, but have their own subcategory
function getSubcategoriesUrls() {
  let categoryUrls = _.map(wikipediaCategories, (categoryName) => {
    return `https://en.wikipedia.org/wiki/Category:${categoryName}`;
  });

  let allPromises = _.map(categoryUrls, (categoryUrl) => {
    const context = '#mw-subcategories .CategoryTreeItem';
    const selectors = ['a@href'];

    let deferred = Promise.pending();
    x(categoryUrl, context, selectors)((err, subcategoryUrls) => {
      if (err) {
        deferred.reject(err);
        return;
      }

      // Extracting the category name from the urls, to form direct access urls
      let pageUrls = _.map(subcategoryUrls, (subcategoryUrl) => {
        return subcategoryUrl.replace('Category:', '');
      });

      deferred.resolve(pageUrls);
    });
    return deferred.promise;
  });

  return Promise.all(allPromises)
    .then((pageUrls) => {
      return _.uniq(_.flatten(pageUrls));
    });
}

// Download all urls and fulfill when all are downloaded
function getPageUrls(categoryPageUrls) {
  // Building the complete list or urls that spans the whole alphabet
  let indexUrls = [];
  let alphabet = '0ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  _.each(wikipediaCategories, (categoryName) => {
    _.each(alphabet, (character) => {
      indexUrls.push(`https://en.wikipedia.org/w/index.php?title=Category:${categoryName}&from=${character}`);
    });
  });

  // We fetch all pages in parallel, using x-ray. We wrap the x-ray calls into
  // promises that we reject/resolve in the x-ray callback.
  let allPromises = _.map(indexUrls, (indexUrl) => {
    const context = '#mw-pages .mw-category-group li';
    const selectors = ['a@href'];

    let deferred = Promise.pending();
    x(indexUrl, context, selectors)((err, pageUrls) => {
      if (err) {
        deferred.reject(err);
        return;
      }
      console.info(`=> ${indexUrl}`);
      deferred.resolve(pageUrls);
    });
    return deferred.promise;
  });

  return Promise.all(allPromises)
    .then((pageUrls) => {
      return _.uniq(_.union(_.flatten(pageUrls), categoryPageUrls));
    });
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
    // Remove "Alternative versions of..."
    if (/wiki\/Alternative_versions_of_/.test(url)) {
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
    // Marvel_Comics lists
    if (/wiki\/Marvel_Comics_/.test(url)) {
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
