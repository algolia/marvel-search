/**
 * Download data from the Marvel API.
 **/
import Promise from 'bluebird';
import crypto from 'crypto';
import helper from './utils/helper.js';
import _ from 'lodash';

const outputDir = './download/marvel';
const limit = 100;
let totalHeroes = '???';

const apiKey = helper.getApiKey('MARVEL_API_KEY', './_marvel_api_key');
const apiKeyPrivate = helper.getApiKey('MARVEL_API_KEY_PRIVATE', './_marvel_api_key_private');
if (!apiKey || !apiKeyPrivate) {
  console.info('Usage:');
  console.info('$ MARVEL_API_KEY=XXXXX MARVEL_API_KEY_PRIVATE=YYYYY npm run step5');
  process.exit();
}
// See https://developer.marvel.com/documentation/authorization
const apiTs = new Date().getTime();
const apiHashSource = `${apiTs}${apiKeyPrivate}${apiKey}`;
const apiHash = crypto.createHash('md5').update(apiHashSource).digest('hex');

helper
  .createOutputDir(outputDir)
  .then(saveMarvelData.bind(null, 0))
  .then(teardown);

// Save all Marvel data to disk. Do it by batch
function saveMarvelData(offset) {
  let nextOffset = offset + limit;
  let queryString = `limit=${limit}&offset=${offset}&ts=${apiTs}&apikey=${apiKey}&hash=${apiHash}`;
  let url = `http://gateway.marvel.com/v1/public/characters?${queryString}`;
  console.info(`Getting characters ${offset}-${nextOffset} / ${totalHeroes}`);

  return helper.readJSONUrl(url)
    .then((response) => {
      // If no data found, the Marvel API failed. We just retry
      if (!response) {
        console.info(`✘ API failing, retrying`);
        return saveMarvelData(offset);
      }

      let {total, results} = response.data;
      if (totalHeroes === '???') {
        totalHeroes = total;
      }

      // Stop if above limit
      if (offset > total) {
        return total;
      }
      console.info(`Saving to disk`);

      let allPromises = _.map(results, (character) => {
        let characterName = character.name;
        let pathName = helper.sanitizeFilename(`${characterName}-${character.id}`);
        let path = `${outputDir}/${pathName}.json`;
        return helper.writeJSON(path, character).then((data) => {
          console.info(`✔ ${characterName}`);
          return data;
        });
      });

      return Promise.all(allPromises).then(() => {
        return saveMarvelData(nextOffset);
      });
    });
}

function teardown(total) {
  console.info(`${total} Marvel characters saved`);
}
