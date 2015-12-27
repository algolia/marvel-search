import URL from 'url';
import Path from 'path';
import jsonfile from 'jsonfile';

const Helper = {
  getWikipediaName(url) {
    return Path.basename(URL.parse(url).pathname);
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
