import _ from 'lodash';
import fs from 'fs';
import algoliasearch from 'algoliasearch';
import HelperJSON from './utils/helper-json.js';
import HelperPath from './utils/helper-path.js';

// We get all files, to get all the record
const recordsPath = './records/';
let appId = 'O3F8QXYK6R';
let indexName = 'marvel';

// Checks the apiKey in ENV and local file
let apiKey = process.env.ALGOLIA_API_KEY;
if (fs.existsSync('./_algolia_api_key')) {
  apiKey = fs.readFileSync('./_algolia_api_key', 'utf8');
}
if (!apiKey) {
  console.info('Usage:');
  console.info('$ ALGOLIA_API_KEY=XXXXX npm run push');
  process.exit();
}
let client = algoliasearch(appId, apiKey);
let indexNameTmp = `${indexName}_tmp`;
let indexTmp = client.initIndex(indexNameTmp);

HelperPath
  .getFiles(`${recordsPath}/*.json`)
  .then((files) => {
    return Promise.all(_.map(files, HelperJSON.read));
  })
  .then(pushRecords)
  ;

// Push data
function pushRecords(records) {
  let indexSettings = {
    attributesToIndex: [
      'name',
      'unordered(aliases)',
      'unordered(secretIdentities)',
      'description',
      'authors,powers,species,teams'
    ],
    attributesForFacetting: [
      'authors',
      'powers',
      'species',
      'teams'
    ],
    customRanking: [
      'desc(ranking.comicCount)',
      'desc(ranking.serieCount)',
      'desc(ranking.storyCount)',
      'desc(ranking.eventCount)',
      'desc(ranking.pageviewCount)'
    ],
    // We have several characters with the same name, but from different
    // universe. We will group them together as to not display twice the same
    // character in the results
    distinct: true,
    attributeForDistinct: 'superName'
  };

  return indexTmp.setSettings(indexSettings)
    .then(() => {
      console.info(`Settings set on index ${indexNameTmp}`);
      return indexTmp.addObjects(records);
    })
    .then(() => {
      console.info(`${records.length} records added to ${indexNameTmp}`);
      return client.moveIndex(indexNameTmp, indexName);
    })
    .then(() => {
      console.info(`Index ${indexNameTmp} renamed to ${indexName}`);
      return records;
    });
}
