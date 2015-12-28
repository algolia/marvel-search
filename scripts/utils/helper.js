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
  }
};

export default Helper;
