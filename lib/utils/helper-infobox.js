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

    // The record is targetting a team, it is of no use for us
    if (Helper.isTeam(simplifiedData)) {
      return null;
    }

    // A lot of second zone characters do not have a specific page, and are
    // redirected to list pages. Usually it should not be an issue because such
    // pages do not have infoboxes, so we'll skip them.  Except for characters
    // whose name starts with an S because
    // https://en.wikipedia.org/wiki/List_of_Marvel_Comics_characters:_S
    // contains ONE infobox, for the character "Skunge".
    // So, if we detect that a character has that name, it is probably not the
    // correct one, and we should just remove it
    if (simplifiedData.character_name === 'Skunge') {
      return null;
    }

    let name = HelperWikipedia.readablePageName(pageName);

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
   * Returns the list of aliases for the characters
   * @function getAliases
   * @param  {object} data Infobox simplified data
   * @return {Array} List of aliases
   **/
  getAliases(data) {
    let aliases = _.get(data, 'aliases');
    aliases = HelperString.multiSplit(aliases, ', ');
    aliases.push(_.get(data, 'character_name'));
    aliases = HelperString.cleanUpList(aliases);
    return aliases;
  },
  /**
   * Returns the list of teams for the characters
   * @function getTeams
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
  },
  /**
   * Returns true if this infobox is for a team instead of a specific character
   * @function isTeam
   * @param  {object} data Infobox simplified data
   * @return {Boolean} True if a team, false if not
   **/
  isTeam(data) {
    let hasMembers = _.get(data, 'members.length') > 0;
    let isCategoryTeam = _.get(data, 'cat') === 'team';

    return hasMembers || isCategoryTeam;
  }
};

export default Helper;
