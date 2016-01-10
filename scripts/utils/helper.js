import _ from 'lodash';
import URL from 'url';
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
    return Path.basename(URL.parse(url).pathname);
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
  }

};

export default Helper;
