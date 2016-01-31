import Promise from 'bluebird';
import URL from 'fast-url-parser';
import fs from 'fs';
import jsonfile from 'jsonfile';
import mkdirp from 'mkdirp';
import request from 'request';
import sanitizeFilename from 'sanitize-filename';
import stringify from 'json-stable-stringify';
import _ from 'lodash';

const Helper = {
  // Returns a promises fullfilled when the specified dir is created
  createOutputDir(path) {
    return Promise.promisify(mkdirp)(path);
  },
  // Returns a promise fullfilled when reading the specified json file
  readJSON(filepath) {
    let promiseReadFile = Promise.promisify(jsonfile.readFile);
    return promiseReadFile(filepath)
      .catch((err) => {
        console.info(`Error when reading file ${filepath}`, err);
      });
  },
  // Returns a promised fulfilled when the specified distant JSON url is fetched
  readJSONUrl(url) {
    let deferred = Promise.pending();
    deferred.promise.catch((err) => {
      console.info(`Error when reading ${url}`, err);
    });

    request(url, (err, response, body) => {
      if (err) {
        deferred.reject(err);
        return;
      }
      if (response.statusCode !== 200) {
        deferred.resolve(null);
        return;
      }

      deferred.resolve(JSON.parse(body));
    });

    return deferred.promise;
  },
  // Returns a promise fulfilled when the specified data is written on disk at
  // the specific path
  writeJSON(filepath, data) {
    let promiseWriteFile = Promise.promisify(fs.writeFile);
    let content = stringify(data, {space: '  '});

    return promiseWriteFile(filepath, content)
      .then(() => {
        return data;
      })
      .catch((err) => {
        console.info(`Error when saving file ${filepath}`, err);
      });
  },
  // Returns the Wikipedia page name from its url
  getWikipediaPageName(url) {
    let pathname = URL.parse(url).pathname;
    return pathname.split('/').pop();
  },
  // Get the specified apiKey from env variable of file on disk
  getApiKey(envName, fileName) {
    let key = process.env[envName];
    if (fs.existsSync(fileName)) {
      key = fs.readFileSync(fileName, 'utf8').trim();
    }
    return key;
  },
  // Checks if the data returned by the wikidata API is missing
  isWikidataMissing(wikidataData) {
    return _.has(wikidataData, 'entities.-1');
  },
  // Check if the data returned by DBPedia is a redirect or the main page
  isDBPediaMissing(dbpediaData, pageName) {
    let resourceKey = `http://dbpedia.org/resource/${pageName}`;
    let resourceValue = dbpediaData[resourceKey];
    let redirectKey = 'http://dbpedia.org/ontology/wikiPageRedirects';
    let listUrl = 'http://dbpedia.org/resource/List_of_Marvel_Comics_characters';

    if (!_.keys(dbpediaData).length) {
      return true;
    }

    // No redirect at all
    if (!_.has(resourceValue, redirectKey)) {
      return false;
    }

    // Redirects to the full page list
    let redirectValue = resourceValue[redirectKey][0].value;
    let regexp = new RegExp(`^${listUrl}`, 'i');
    return regexp.test(redirectValue);
  },
  // Get filename suitable for writing on disk
  sanitizeFilename(input) {
    let sanitized = sanitizeFilename(input);
    sanitized = sanitized.replace(/ /g, '_');
    sanitized = sanitized.replace(/\.+$/, '');

    return sanitized;
  },




  // Split a string on several separators
  multiSplit(string, ...separators) {
    let results = [string];
    let tmp = [];

    separators.forEach((separator) => {
      // We split each element in the current results according to the split and
      // we add it to the tmp
      results.forEach((item) => {
        tmp.push.apply(tmp, item.split(separator));
      });
      results = tmp;
      tmp = [];
    });
    return results;
  },
  getCharacterNameFromUrl(url) {
    let name = this.getWikipediaPageName(url);
    name = name.replace(/\((.*)\)/g, '');
    name = name.replace(/_/g, ' ');
    name = name.trim();

    return name;
  },
  getJSONFilepathFromUrl(url, basepath = null) {
    let basename = this.getWikipediaPageName(url);
    basename += '.json';

    if (!basepath) {
      return basename;
    }

    // Add missing trailing slash
    if (basepath.slice(-1) !== '/') {
      basepath += '/';
    }

    return `${basepath}${basename}`;
  },
  // Get a unique string key form a marvel character name
  getMarvelKeyFromName(originalName) {
    let name = originalName.replace(/ /g, '_');
    name = name.toLowerCase();
    return name;
  },
  // Given a raw character response from the Marvel API, returns a formatted and
  // curated object
  getMarvelDataFromRaw(input) {
    let image = null;
    if (input.thumbnail) {
      image = `${input.thumbnail.path}.${input.thumbnail.extension}`;
      if (/image_not_available/.test(image)) {
        image = null;
      }
    }

    let counts = {};
    _.each(['comics', 'events', 'series', 'stories'], (type) => {
      let count = 0;
      if (input[type] && input[type].available) {
        count = input[type].available;
      }
      counts[type] = count;
    });

    let url = null;
    if (input.urls) {
      let wiki = _.find(input.urls, {type: 'wiki'});
      if (wiki) {
        url = wiki.url;
      }
      if (url) {
        url = this.removeUTMFromUrl(url);
      }
    }

    return {
      name: input.name,
      description: input.description,
      id: input.id,
      url,
      image,
      counts
    };
  },
  // Given a url, returns the utm_ parameters
  removeUTMFromUrl(url) {
    let parsedUrl = URL.parse(url, true);

    let query = {};
    _.each(parsedUrl.query, (value, key) => {
      if (/^utm_/.test(key)) {
        return;
      }
      query[key] = value;
    });

    return URL.format({
      protocol: parsedUrl.protocol,
      host: parsedUrl.host,
      pathname: parsedUrl.pathname,
      query,
      hash: parsedUrl.hash
    });
  },

  isMarvelNameEqualToWikiData(marvelName, wikiData) {
    let name = wikiData.name;
    name = name.replace('The ', '');

    let realName = wikiData.realName;
    let aliases = wikiData.aliases;
    let url = wikiData.url;

    // Abomination (Emil Blonsky)
    let matches = marvelName.match(/^(.*) \((.*)\)$/) || [];
    let marvelBase = matches[1]; // Abomination
    let marvelSuffix = matches[2]; // Emil Blonsky

    // Abomination
    // The Abomination
    if (name === marvelName) {
      return true;
    }

    // Abomination (Emil Blonsky)
    let nameEqualsMarvelBase = (name === marvelBase);
    let realNameEqualsMarvelSuffix = (realName === marvelSuffix);
    if (nameEqualsMarvelBase && realNameEqualsMarvelSuffix) {
      return true;
    }

    // Angel (Warren Worthington III)
    if (aliases) {
      let aliasesMatchesMarvelBase = aliases.match(new RegExp(marvelBase, 'i'));
      let nameEqualsMarvelSuffix = (name === marvelSuffix);
      if (aliasesMatchesMarvelBase && nameEqualsMarvelSuffix) {
        return true;
      }
    }

    // Ant-Man (Scott Lang)
    if (url) {
      let urlName = this.getWikipediaPageName(url);
      let underscoredMarvelName = marvelName.replace(/ /g, '_');
      if (urlName === underscoredMarvelName) {
        return true;
      }
    }

    return false;
  }

};

export default Helper;
