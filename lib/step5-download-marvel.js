import async from 'async';
import crypto from 'crypto';
import fs from 'fs';
import request from 'request';
import stringify from 'json-stable-stringify';
import _ from 'lodash';

// STEP 5: Download marvel data from the developers API
const distPath = './download/step5-marvel/';
let batchIndex = 0;
const batchLimit = 100;
let characterCount = 0;
const apiKey = getApiKey('MARVEL_API_KEY', './_marvel_api_key');
const apiKeyPrivate = getApiKey('MARVEL_API_KEY_PRIVATE', './_marvel_api_key_private');
if (!apiKey || !apiKeyPrivate) {
  console.info('Usage:');
  console.info('$ MARVEL_API_KEY=XXXXX MARVEL_API_KEY_PRIVATE=YYYYY npm run step5');
  process.exit();
}
// See https://developer.marvel.com/documentation/authorization
const apiTs = new Date().getTime();
const apiHashSource = `${apiTs}${apiKeyPrivate}${apiKey}`;
const apiHash = crypto.createHash('md5').update(apiHashSource).digest('hex');

// We get the heroes by batch
downloadCharacters(batchIndex, batchLimit);

// Get the specified apiKey from env variable of file on disk
function getApiKey(envName, fileName) {
  let key = process.env[envName];
  if (fs.existsSync(fileName)) {
    key = fs.readFileSync(fileName, 'utf8').trim();
  }
  return key;
}

function downloadCharacters(offset, limit) {
  let queryString = `limit=${limit}&offset=${offset}&ts=${apiTs}&apikey=${apiKey}&hash=${apiHash}`;
  let url = `http://gateway.marvel.com/v1/public/characters?${queryString}`;
  console.info(`Getting characters ${offset}-${offset + limit}`);

  request(url, (err, response, body) => {
    if (err) {
      console.info(`⚠ Error in API`, err);
      return;
    }
    if (!err && response.statusCode === 200) {
      splitAndSaveCharacters(JSON.parse(body));
    }
  });
}


function splitAndSaveCharacters(response) {
  let data = response.data;
  let {total, results} = data;

  // Create an array of promises to save data on disk
  let batchPromises = _.map(results, (result) => {
    let savePath = `${distPath}${result.id}.json`;
    let stringContent = stringify(result, {space: '  '});

    return (callback) => {
      // Force JSON to order keys, so diffs are easier to read
      fs.writeFile(savePath, stringContent, () => {
        callback(null, result);
      });
    };
  });

  async.parallel(batchPromises, (errParallel, responses) => {
    if (errParallel) {
      console.info('⚠ Error in parallel', errParallel);
      return;
    }

    characterCount += responses.length;

    // Go to next 100
    batchIndex += batchLimit;
    if (batchIndex > total) {
      console.info(`Saved ${characterCount} characters`);
      return;
    }
    downloadCharacters(batchIndex, batchLimit);
  });
}
