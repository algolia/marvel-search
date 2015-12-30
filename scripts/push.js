import glob from 'glob';
import algoliasearch from 'algoliasearch';
import jsonfile from 'jsonfile';

// We get all files, to get all the record
const recordsPath = './records/';
let records = [];
let appId = 'O3F8QXYK6R';
let apiKey = process.env.ALGOLIA_API_KEY;

if (!apiKey) {
  console.info('Usage:');
  console.info('$ ALGOLIA_API_KEY=XXXXX npm run push');
  process.exit();
}

let client = algoliasearch(appId, apiKey);
let index = client.initIndex('marvel_tmp');
let indexSettings = {
  attributesToIndex: [
    'name',
    'aliases',
    'realName',
    'powersText',
    'teams'
  ],
  attributesForFacetting: [
    'creators',
    'teams',
    'species',
    'partners',
    'powers'
  ],
  customRanking: [
    'desc(pageviews)'
  ],
  hitsPerPage: 200,
  removeWordsIfNoResults: 'allOptional'
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
      console.info('Records pushed');
      return index.setSettings(indexSettings);
    })
    .then(() => {
      console.info('Settings updated');
      return client.moveIndex('marvel_tmp', 'marvel');
    })
    .then(() => {
      console.info('Atomic replace done');
    });
});
