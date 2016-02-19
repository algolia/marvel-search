/**
 * Download number of pageviews in the last 90 days for each URL.
 **/
import _ from 'lodash';
import HelperJSON from './utils/helper-json.js';
import HelperPath from './utils/helper-path.js';
import HelperWikipedia from './utils/helper-wikipedia.js';

const outputDir = './download/pageviews';
const urlsFile = './download/urls/urls.json';
const batchOffset = 50;
let initialCount = 0;

HelperPath.createDir(outputDir)
  .then(getUrls)
  .then(getPageviews)
  .then(teardown);

// Get the full list of urls saved on disk
function getUrls() {
  return HelperJSON.read(urlsFile).then((urls) => {
    initialCount = urls.length;
    return urls;
  });
}

// Gets the pageviews for last 90 days
function getPageviews(urls, batchIndex = 0, total = 0) {
  let urlCount = urls.length;

  // Out of bounds, we can return the total
  if (batchIndex > urlCount) {
    return total;
  }

  let batchLimit = batchIndex + batchOffset;
  let batchItems = urls.slice(batchIndex, batchLimit);

  let allPromises = _.map(batchItems, (url) => {
    const pageName = HelperWikipedia.pageName(url);
    const statsUrl = `http://stats.grok.se/json/en/latest90/${pageName}`;

    return HelperJSON.readUrl(statsUrl)
      .then((stats) => {
        let latest90 = _.sum(_.values(stats.daily_views));
        let character = {
          wikipediaUrl: url,
          pageviews: {
            latest90,
            rank: stats.rank
          }
        };
        let path = `${outputDir}/${pageName}.json`;
        return HelperJSON.write(path, character).then((data) => {
          console.info(`✔ ${pageName}`);
          return data;
        });
      });
  });

  return Promise.all(allPromises).then((data) => {
    data = _.compact(data);
    total += data.length;
    return getPageviews(urls, batchLimit, total);
  });
}

function teardown(total) {
  console.info(`${total}/${initialCount} pageviews data saved`);
}
