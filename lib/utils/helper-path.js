import Promise from 'bluebird';
import mkdirp from 'mkdirp';
import sanitizeFilename from 'sanitize-filename';

const Helper = {
  /**
   * Creates the specified directory
   * @function createDir
   * @param  {string} dirPath Directory to create
   * @return {Promise} Promised fulfilled when the directory is created
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
  // Get filename suitable for writing on disk
  sanitizeFilename(input) {
    let sanitized = sanitizeFilename(input);
    sanitized = sanitized.replace(/ /g, '_');
    sanitized = sanitized.replace(/\.+$/, '');

    return sanitized;
  }
};

export default Helper;
