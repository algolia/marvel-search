import _ from 'lodash';
import URL from 'fast-url-parser';
import Path from 'path';
import jsonfile from 'jsonfile';

const Helper = {
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
  getWikipediaName(url) {
    let pathname = URL.parse(url).pathname;
    return pathname.split('/').pop();
  },
  getCharacterNameFromUrl(url) {
    let name = this.getWikipediaName(url);
    name = name.replace(/\((.*)\)/g, '');
    name = name.replace(/_/g, ' ');
    name = name.trim();

    return name;
  },
  getJSONFilepathFromUrl(url, basepath = null) {
    let basename = this.getWikipediaName(url);
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
  writeJSON(filepath, data) {
    jsonfile.writeFile(filepath, data, {spaces: 2}, (errWriteFile) => {
      if (errWriteFile) {
        console.info('Error when saving file', errWriteFile);
        return;
      }
      console.info(`Saving ${filepath} to disk`);
    });
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
      let urlName = this.getWikipediaName(url);
      let underscoredMarvelName = marvelName.replace(/ /g, '_');
      if (urlName === underscoredMarvelName) {
        return true;
      }
    }

    return false;
  }

};

export default Helper;
