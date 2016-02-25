import _ from 'lodash';
import Promise from 'bluebird';
import infobox from 'wiki-infobox';
import HelperString from './helper-string.js';
import HelperWikipedia from './helper-wikipedia.js';

const Helper = {
  /**
   * Download the JSON representation of an infobox for any given Wikipedia page
   * name
   * @function get
   * @param  {string} pageName Wikipedia page name
   * @return {Promise} Promise fulfilled with the object representing the infobox
   **/
  get(pageName) {
    return Promise.promisify(infobox)(decodeURI(pageName), 'en');
  },
  /**
   * Given a raw version of the data downloaded from the infobox, will return an
   * easier-to-parse object representation
   * @function simplifyRaw
   * @param  {object} rawData Raw data as returned by the infobox module
   * @return {object} A simpler version of the data
   **/
  simplifyRaw(rawData) {
    function objectToString(object) {
      let type = _.get(object, 'type');
      if (type === 'text') {
        return _.trim(_.get(object, 'value', ''));
      }
      if (type === 'link') {
        return _.trim(_.get(object, 'text', ''));
      }
    }

    return _.mapValues(rawData, (value) => {
      if (_.isArray(value)) {
        return _.map(value, objectToString);
      }
      return objectToString(value);
    });
  },
  /**
   * Given the raw data retrieved through the infobox, will return an object
   * only containing the curated values to be importer in a record
   * @function getRecordData
   * @param  {object} rawData Raw data as returned by the infobox module
   * @param  {String} [pageName] Optional page name, to use as a fallback if no
   * name is found
   * @return {object} A record-ready version of the data
   **/
  getRecordData(rawData, pageName = null) {
    let simplifiedData = Helper.simplifyRaw(rawData);
    let name = Helper.getName(simplifiedData, pageName);

    // If we got the name Skunge when it wasn't Skunge as input, the it means we
    // hit https://en.wikipedia.org/wiki/List_of_Marvel_Comics_characters:_S and
    // all characters will have Skunge data. In that case, we just fail
    if (name === 'Skunge' && pageName !== 'Skunge') {
      return null;
    }

    let aliases = Helper.getAliases(simplifiedData);
    let alliances = Helper.getAlliances(simplifiedData);
    let authors = Helper.getAuthors(simplifiedData);
    let isHero = Helper.isHero(simplifiedData);
    let partners = Helper.getPartners(simplifiedData);
    let powers = Helper.getPowers(simplifiedData);
    let secretIdentities = Helper.getSecretIdentities(simplifiedData);

    return {
      aliases,
      alliances,
      authors,
      isHero,
      name,
      partners,
      powers,
      secretIdentities
    };
  },
  /**
   * Will split a string or array on common separators often found in the
   * infoboxes (like new lines, bullet points, etc). Note that this purposefully
   * does not split on commas because for some values we might want to keep the
   * comma in the final values.
   * @function splitOnCommonSeparators
   * @param  {String|Array} data String or Array to split
   * @return {Array} Split array
   **/
  splitOnCommonSeparators(data) {
    let splitSeparators = [
      '<br>',
      '<BR>',
      '<br/>',
      '<br />',
      '*'
    ];
    return HelperString.multiSplit(data, ...splitSeparators);
  },
  /**
   * Given a string or array of elements, will clean it to remove any unusable
   * value, clean each individual one and return an array with uniqued values.
   * @function cleanUpList
   * @param  {String|Array} data String or Array to clean
   * @return {Array} Clean array
   **/
  cleanUpList(data) {
    data = Helper.splitOnCommonSeparators(data);
    data = Helper.trimItemsInList(data);
    data = Helper.rejectBadItemsInList(data);
    data = Helper.trimItemsInList(data);
    data = _.uniq(_.compact(data));
    return data;
  },
  /**
   * Given a string or array of elements, will trim any unwanted characters
   * @function trimItemsInList
   * @param  {String|Array} data String or Array to trim
   * @return {Array} Trimmed array
   **/
  trimItemsInList(data) {
    return _.map(data, (item) => {
      item = _.trim(item, '{},*');
      item = item.replace(/^'''/, '').replace(/'''$/, '');
      item = item.replace(/^- /, '');
      item = _.trim(item);
      return item;
    });
  },
  /**
   * Given a string or array of elements, will remove any unwanted elements
   * @function rejectBadItemsInList
   * @param  {String|Array} data String or Array to filter
   * @return {Array} Filtered array
   **/
  rejectBadItemsInList(data) {
    let SEPARATOR_BLACKLIST = [
      '<br>',
      '<br/>',
      '<br />',
      'and',
      '*',
      '?',
      '&'
    ];
    return _.reject(data, (item) => {
      // Contains a buggy PLain list
      if (_.includes(item, 'Plain list')) {
        return true;
      }
      // "Adapted by:"
      if (_.endsWith(item, ':')) {
        return true;
      }
      // Only contains a separator
      if (_.includes(SEPARATOR_BLACKLIST, item)) {
        return true;
      }
      // Looks like a comment
      if (_.startsWith(item, '<!--') || _.endsWith(item, '-->')) {
        return true;
      }
      // Is in parenthesis
      if (_.startsWith(item, '(') && _.endsWith(item, ')')) {
        return true;
      }
      return false;
    });
  },

  getName(data, pageName = null) {
    let name = _.get(data, 'character_name');
    if (!name) {
      name = HelperWikipedia.readablePageName(pageName);
    }
    return name;
  },
  getAliases(data) {
    let aliases = _.get(data, 'aliases');
    aliases = HelperString.multiSplit(aliases, ', ');
    aliases = Helper.cleanUpList(aliases);
    return aliases;
  },
  getAlliances(data) {
    return Helper.cleanUpList(_.get(data, 'alliances'));
  },
  getAuthors(data) {
    return Helper.cleanUpList(_.get(data, 'creators'));
  },
  getPartners(data) {
    return Helper.cleanUpList(_.get(data, 'partners'));
  },
  getPowers(data) {
    let powers = _.get(data, 'powers', []);
    powers = HelperString.multiSplit(powers, ', ', ' and ');
    powers = Helper.cleanUpList(powers);
    return powers;
  },
  getSecretIdentities(data) {
    let secretIdentities = _.compact([
      _.get(data, 'real_name'),
      _.get(data, 'alter_ego')
    ]);
    secretIdentities = Helper.cleanUpList(secretIdentities);
    return secretIdentities;
  },


  isHero(data) {
    return _.get(data, 'hero') === 'y';
  }



};

export default Helper;
