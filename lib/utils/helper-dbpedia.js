import _ from 'lodash';
import helper from './helper.js';

const Helper = {
  WIKI_PAGE_REDIRECTS_URL: 'http://dbpedia.org/ontology/wikiPageRedirects',
  MARVEL_CHARACTERS_LIST_URL: 'http://dbpedia.org/resource/List_of_Marvel_Comics_characters',
  /**
   * Check if the data returned by the API is missing
   * @function isReceivedDataMissing
   * @param  {object} receivedData Original data received
   * @param  {string} pageName Requested page name
   * @return {Boolean} True if data is missing, false otherwise
   **/
  isReceivedDataMissing(receivedData, pageName) {
    let resourceKey = `http://dbpedia.org/resource/${pageName}`;
    let resourceValue = receivedData[resourceKey];

    if (!_.keys(receivedData).length) {
      return true;
    }


    // This is not a redirect, so it's ok
    if (!_.has(resourceValue, Helper.WIKI_PAGE_REDIRECTS_URL)) {
      return false;
    }

    // Redirects to the full page list
    let redirectValue = resourceValue[Helper.WIKI_PAGE_REDIRECTS_URL][0].value;
    let regexp = new RegExp(`^${Helper.MARVEL_CHARACTERS_LIST_URL}`, 'i');
    return regexp.test(redirectValue);
  },
  // Given a DBPedia value, will split it on specific stop words
  splitDBPediaValue(value) {
    if (_.isString(value)) {
      return helper.multiSplit(value, ' and ');
    }
    if (_.isArray(value)) {
      return _.map(value, helper.splitDBPediaValue);
    }
    return value;
  }
};

export default Helper;
