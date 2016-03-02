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
    let teams = Helper.getTeams(simplifiedData);
    let authors = Helper.getAuthors(simplifiedData);
    let isHero = Helper.isHero(simplifiedData);
    let partners = Helper.getPartners(simplifiedData);
    let powers = Helper.getPowers(simplifiedData);
    let secretIdentities = Helper.getSecretIdentities(simplifiedData);

    return {
      aliases,
      teams,
      authors,
      isHero,
      name,
      partners,
      powers,
      secretIdentities
    };
  },
  /**
   * Returns the name of the character from its infobox. Fallback to the
   * pageName if given
   * @function getName
   * @param  {object} data Infobox simplified data
   * @param  {String} [pageName] Optional page name, to use as a fallback if no
   * name is found
   * @return {String} Character name
   **/
  getName(data, pageName = null) {
    let name = _.get(data, 'character_name');
    if (!name) {
      name = HelperWikipedia.readablePageName(pageName);
    }
    return name;
  },
  /**
   * Returns the list of aliases for the characters
   * @function getAliases
   * @param  {object} data Infobox simplified data
   * @return {Array} List of aliases
   **/
  getAliases(data) {
    let aliases = _.get(data, 'aliases');
    aliases = HelperString.multiSplit(aliases, ', ');
    aliases = HelperString.cleanUpList(aliases);
    return aliases;
  },
  /**
   * Returns the list of aliases for the characters
   * @function getAliases
   * @param  {object} data Infobox simplified data
   * @return {Array} List of aliases
   **/
  getTeams(data) {
    return HelperString.cleanUpList(_.get(data, 'alliances'));
  },
  /**
   * Returns the list of authors for the characters
   * @function getAuthors
   * @param  {object} data Infobox simplified data
   * @return {Array} List of authors
   **/
  getAuthors(data) {
    return HelperString.cleanUpList(_.get(data, 'creators'));
  },
  /**
   * Returns the list of partners for the characters
   * @function getPartners
   * @param  {object} data Infobox simplified data
   * @return {Array} List of partners
   **/
  getPartners(data) {
    let partners = _.get(data, 'partners', []);
    partners = HelperString.multiSplit(partners, ', ');
    partners = HelperString.cleanUpList(partners);
    return partners;
  },
  /**
   * Returns the list of powers for the characters
   * @function getPowers
   * @param  {object} data Infobox simplified data
   * @return {Array} List of powers
   **/
  getPowers(data) {
    let powers = _.get(data, 'powers', []);
    powers = HelperString.multiSplit(powers, ', ', ' and ', /^and /);
    powers = HelperString.cleanUpList(powers);
    powers = _.reject(powers, (power) => {
      return power.length > 25;
    });
    return powers;
  },
  /**
   * Returns the list of secret identities for the characters
   * @function getSecretIdentities
   * @param  {object} data Infobox simplified data
   * @return {Array} List of secret identities
   **/
  getSecretIdentities(data) {
    let secretIdentities = _.compact([
      _.get(data, 'real_name'),
      _.get(data, 'alter_ego')
    ]);
    secretIdentities = HelperString.multiSplit(secretIdentities, ', ');
    secretIdentities = HelperString.cleanUpList(secretIdentities);
    return secretIdentities;
  },
  /**
   * Returns true if the character is marked as a hero
   * @function getSecretIdentities
   * @param  {object} data Infobox simplified data
   * @return {Array} List of secret identities
   **/
  isHero(data) {
    return _.get(data, 'hero') === 'y';
  }
};

export default Helper;
