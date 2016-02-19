import Promise from 'bluebird';
import fs from 'fs';
import jsonfile from 'jsonfile';
import request from 'request';
import stringify from 'json-stable-stringify';

const Helper = {
  /**
   * Reads the specified json file and return its content as an object
   * @function read
   * @param  {string} filepath Filepath of the file to read
   * @return {Promise} Promise fulfilled with the file content as an object
   **/
  read(filepath) {
    let promiseReadFile = Promise.promisify(jsonfile.readFile);
    return promiseReadFile(filepath);
  },
  /**
   * Reads the specified remote json file and return its content as an object
   * @function readUrl
   * @param  {string} url Url of the file to read
   * @return {Promise} Promise fulfilled with the url content as an object
   **/
  readUrl(url) {
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
  /**
   * Writes the specified data at the specified filepath
   * @function write
   * @param  {string} filepath Path to the file to write
   * @param  {Object} data Data to write to the file, as JSON
   * @return {Promise} Promise fulfilled when the data is written
   **/
  write(filepath, data) {
    let promiseWriteFile = Promise.promisify(fs.writeFile);
    let content = stringify(data, {space: '  '});

    return promiseWriteFile(filepath, content)
      .then(() => {
        return data;
      })
      .catch((err) => {
        console.info(`Error when saving file ${filepath}`, err);
      });
  }
};

export default Helper;
