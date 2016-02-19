import _ from 'lodash';
import HelperString from './helper-string.js';
import HelperWikipedia from './helper-wikipedia.js';

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

  /**
   * Given a raw DBPedia dump returned by the API, this method will return the
   * curated data to be used in the record
   * @function getRecordData
   * @param  {object} pageName Original page name
   * @param  {string} rawData The data, as received from the API
   * @return {Object} The curated version of the data
   **/
  getRecordData(pageName, rawData) {
    // We first get a simpler version of the object
    let simplifiedData = Helper.simplifyRaw(pageName, rawData);

    let authors = _.get(simplifiedData, 'property.creators');
    authors = HelperString.splitEnglish(authors);

    let aliases = _.get(simplifiedData, 'property.aliases');
    aliases = HelperString.splitEnglish(aliases);

    let powers = _.get(simplifiedData, 'property.powers');
    powers = HelperString.splitEnglish(powers);

    let isVillain = _.get(simplifiedData, 'property.villain');
    isVillain = isVillain === 'y';
    let isHero = _.get(simplifiedData, 'property.hero');
    isHero = isHero === 'y';


    // We keep only what we need
    let recordData = {
      description: _.get(simplifiedData, 'ontology.abstract'),
      wikipediaId: _.get(simplifiedData, 'ontology.wikiPageID'),
      // Names
      aliases,
      realName: _.get(simplifiedData, 'property.realName'),
      characterName: _.get(simplifiedData, 'property.characterName'),
      title: _.get(simplifiedData, 'property.title'),
      // Facets
      alliances: _.get(simplifiedData, 'property.alliances'),
      authors,
      powers,
      specy: _.get(simplifiedData, 'property.species'),
      // Villain/Hero
      isVillain,
      isHero
    };

    recordData = Helper.cleanUpUrls(recordData);

    return recordData;
  },

  // TODO
  // splitAuthors to split authors by "and" and remove last "."
  // splitPowers to not split by " and "
  // and all the tests to go with it
  // maybe need to move it out of splitEnglish

  /**
   * Given an object, will transform all the values containing a url to
   * a dbpedia ressource to this ressource name, recursively.
   * @function cleanUpUrls
   * @param  {object} value Input value. Can be of any type
   * @return {Object} Same data, but with names instead of DBPedia urls
   **/
  cleanUpUrls(value) {
    let dbpediaUrl = 'http://dbpedia.org/resource/';

    // If string, we clean it up
    if (_.isString(value)) {
      // Not a url, we keep it that way
      if (!_.startsWith(value, dbpediaUrl)) {
        return value;
      }

      value = value.replace(dbpediaUrl, '');
      value = HelperWikipedia.readablePageName(value);
      return value;
    }

    if (_.isArray(value)) {
      return _.map(value, Helper.cleanUpUrls);
    }

    if (_.isPlainObject(value)) {
      return _.mapValues(value, Helper.cleanUpUrls);
    }

    return value;
  },

  /**
   * Given a raw DBPedia dump returned by the API, this method will returns
   * a simpler object with only the keys relative to the requested page, and
   * will remove most of the unneeded nested levels of data.
   * @function simplifyRaw
   * @param  {object} pageName Original page name
   * @param  {string} rawData The data, as received from the API
   * @return {Object} A simpler version of the data
   **/
  simplifyRaw(pageName, rawData) {
    // We only keep the data for the specified page
    let mainKey = `http://dbpedia.org/resource/${pageName}`;
    if (!_.has(rawData, mainKey)) {
      return null;
    }
    let dbpedia = rawData[mainKey];

    let data = {};
    _.each(dbpedia, (urlValues, urlKey) => {
      // We skip entried that are not from dbpedia.org
      let splitUrl = urlKey.split('/');
      if (splitUrl[2] !== 'dbpedia.org') {
        return;
      }

      let keyName = splitUrl.pop();
      let categoryName = splitUrl.pop();

      _.each(urlValues, (urlValue) => {
        // If a lang is specified, we only keep the english ones
        if (_.has(urlValue, 'lang') && urlValue.lang !== 'en') {
          return;
        }

        let value = urlValue.value;

        // Create top level category if not yet existing
        if (!_.has(data, categoryName)) {
          data[categoryName] = {};
        }

        // Replacing single value with array when adding another one
        if (_.has(data, `${categoryName}.${keyName}`)) {
          let existingKey = data[categoryName][keyName];
          if (_.isArray(existingKey)) {
            existingKey.push(value);
          } else {
            data[categoryName][keyName] = [existingKey, value];
          }
        } else {
          data[categoryName][keyName] = value;
        }
      });
    });

    return data;
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
