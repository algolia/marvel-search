import Promise from 'bluebird';
import fs from 'fs';
import glob from 'glob';
import mkdirp from 'mkdirp';
import request from 'request';
import sanitizeFilename from 'sanitize-filename';

const Helper = {
  /**
   * Creates the specified directory
   * @function createDir
   * @param  {string} dirPath Directory to create
   * @return {Promise} Promise fulfilled when the directory is created
   **/
  createDir(dirPath) {
    return Promise.promisify(mkdirp)(dirPath);
  },
  /**
   * Sanitize a filename so it can be written on disk with risk
   * @function sanitizeFilename
   * @param  {string} input Original filename to sanitize
   * @return {string} Sanitized version of the filename
   **/
  sanitizeFilename(input) {
    let sanitized = sanitizeFilename(input);
    sanitized = sanitized.replace(/ /g, '_');
    sanitized = sanitized.replace(/\.+$/, '');

    return sanitized;
  },
  /**
   * Get the list of all files matching the specified pattern
   * @function getFiles
   * @param  {string} pattern Glob pattern to match
   * @return {Promise} Promise fulfilled with the list of matching files
   **/
  getFiles(pattern) {
    return Promise.promisify(glob)(pattern);
  },
  /**
   * Download a file from a specific url and save it in the specified location
   * @function downloadUrl
   * @param  {string} url Url of the ressource
   * @param  {string} filepath Filepath where to save it
   * @return {Promise} Promise fulfilled with the written filepath
   **/
  downloadUrl(url, filepath) {
    return Promise.promisify(request)(url).then((response) => {
      if (response.statusCode !== 200) {
        return null;
      }
      return Promise.promisify(fs.writeFile)(filepath, response.body)
        .then(() => {
          return filepath;
        });
    })
    .catch((err) => {
      console.info(`Error when reading ${url}`, err);
    });
  }
};

export default Helper;
