import fs from 'fs';
import glob from 'glob';
import algoliasearch from 'algoliasearch';
import jsonfile from 'jsonfile';

// We get all files, to get all the record
const recordsPath = './records/';
let records = [];
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
let index = client.initIndex(`${indexName}_tmp`);
let indexSettings = {
  attributesToIndex: [
    'name',
    'realName',
    'aliases',
    'marvel.description'
  ],
  attributesForFacetting: [
    'creators',
    'teams',
    'species',
    'partners',
    'powers'
  ],
  customRanking: [
    'desc(marvel.counts.comics)',
    'desc(marvel.counts.series)',
    'desc(marvel.counts.stories)',
    'desc(marvel.counts.events)',
    'desc(pageviews)'
  ],
  hitsPerPage: 200,
  removeWordsIfNoResults: 'allOptional',
  distinct: true,
  attributeForDistinct: 'name'
};

glob(`${recordsPath}/*.json`, (errGlob, recordFiles) => {
  if (errGlob) {
    console.info('Error in globbing', errGlob);
    return;
  }

  // Get the list of all records
  recordFiles.forEach((recordFile) => {
    const record = jsonfile.readFileSync(recordFile);
    records.push(record);
  });

  // Push data
  index.addObjects(records)
    .then(() => {
      console.info(`${records.length} records pushed`);
      return index.setSettings(indexSettings);
    })
    .then(() => {
      console.info('Settings updated');
      return client.moveIndex(`${indexName}_tmp`, indexName);
    })
    .then(() => {
      console.info(`${indexName}_tmp renamed to ${indexName}`);
    });
});
