/**
 * Download pages from the Marvel website
 **/
import _ from 'lodash';
import Promise from 'bluebird';
import HelperPath from './utils/helper-path.js';
import HelperJSON from './utils/helper-json.js';
import HelperMarvel from './utils/helper-marvel.js';

const marvelApiDir = './download/marvel/api/';
const marvelWebsiteHtmlDir = './download/marvel/website';

HelperPath.createDir(marvelWebsiteHtmlDir)
  .then(getMarvelUrls)
  .then(downloadHTML)
  ;

// Get all urls of marvel heroes
function getMarvelUrls() {
  return HelperPath.getFiles(`${marvelApiDir}/*.json`)
  .then((files) => {
    return Promise.all(_.map(files, HelperJSON.read));
  })
  .then((characters) => {
    return _.compact(_.uniq(_.map(characters, (character) => {
      let url = HelperMarvel.getUrl(character);
      if (_.startsWith(url, 'http://marvel.com/comics/')) {
        return null;
      }
      return {
        marvelId: character.id,
        url: HelperMarvel.getUrl(character)
      };
    })));
  });
}

// Save the HTML on disk
function downloadHTML(data, filepaths = [], from = 0) {
  let urlCount = data.length;
  let size = 10;
  let to = Math.min(from + size, urlCount);
  let batch = data.slice(from, to + size);

  // Stop when out of bounds
  if (from > urlCount) {
    return _.uniq(filepaths).sort();
  }

  console.info(`Downloading pages ${from}-${to} / ${urlCount}`);

  return Promise.all(_.map(batch, (item) => {
    let filepath = `${marvelWebsiteHtmlDir}/${item.marvelId}.html`;
    return HelperPath.downloadUrl(item.url, filepath);
  })).then((newFilepaths) => {
    filepaths = _.concat(filepaths, _.compact(newFilepaths));
    return downloadHTML(data, filepaths, to + 1);
  });
}
