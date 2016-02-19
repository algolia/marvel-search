import fs from 'fs';

const Helper = {
  /**
   * Get the API key from the ENV variables, or fallback to file on disk
   * @function getKey
   * @param  {string} envName Name of the environment variable holding the value
   * @param  {string} fileName Filepath holding the value as fallback
   * @return {string} API key value
   **/
  getKey(envName, fileName) {
    let key = process.env[envName];
    if (fs.existsSync(fileName)) {
      key = fs.readFileSync(fileName, 'utf8').trim();
    }
    return key;
  }
};

export default Helper;
