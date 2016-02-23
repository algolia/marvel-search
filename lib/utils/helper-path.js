import Promise from 'bluebird';
import mkdirp from 'mkdirp';
import glob from 'glob';
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
  }
};

export default Helper;
