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
    let name = Helper.getName(simplifiedData, pageName);
    // Unable to find a suitable name, so this might be a page listing all
    // characters of a secondary team, like
    // https://en.wikipedia.org/wiki/Children_of_the_Vault#Members
    if (!name) {
      return null;
    }

    let aliases = Helper.getAliases(simplifiedData, pageName);
    let teams = Helper.getTeams(simplifiedData);
    let authors = Helper.getAuthors(simplifiedData);
    let isHero = Helper.isHero(simplifiedData);
    let isVillain = Helper.isVillain(simplifiedData);
    let partners = Helper.getPartners(simplifiedData);
    let powers = Helper.getPowers(simplifiedData);
    let secretIdentities = Helper.getSecretIdentities(simplifiedData);
    let species = Helper.getSpecies(simplifiedData);
    let description = Helper.getDescription(simplifiedData);

    // We keep only what we need
    let recordData = {
      description,
      wikipediaId: _.get(simplifiedData, 'ontology.wikiPageID'),
      aliases,
      name,
      secretIdentities,
      teams,
      authors,
      partners,
      powers,
      species,
      isVillain,
      isHero
    };

    return recordData;
  },
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
   * Given a DBPedia simplified structure, will return the character name.
   * If the name is not suitable, will revert to guessing it from the pageName
   * @function getName
   * @param  {object} data The simplified DBPedia data
   * @return {String} The name of the character
   **/
  getName(data, pageName = null) {
    let name = _.toString(
      _.get(data, 'property.characterName') ||
      _.get(data, 'property.title')
    );

    // If multiple names, we revert to the pageName
    let isEmptyName = (!name);
    let containsSeveralNames = (name.indexOf(',') !== -1);
    if (isEmptyName || containsSeveralNames) {
      return HelperWikipedia.readablePageName(pageName);
    }

    name = name.replace(/^The /, '');

    return name;
  },
  /**
   * Given a DBPedia simplified structure, will return the character description
   * If the description is too long, we'll only keep the first sentence.
   * @function getName
   * @param  {object} data The simplified DBPedia data
   * @return {String} The short description of the character
   **/
  getDescription(data) {
    let description = _.get(data, 'ontology.abstract', '');
    return HelperString.firstSentence(description);
  },
  /**
   * Given a DBPedia simplified structure, will return the list of authors.
   * @function getAuthors
   * @param  {object} data The simplified DBPedia data
   * @return {Array} The curated list of authors
   **/
  getAuthors(data) {
    let authors = _.get(data, 'property.creators', []);
    authors = Helper.cleanUpUrls(authors);
    authors = HelperString.splitOnCommas(authors);
    authors = HelperString.cleanUpList(authors);
    return authors;
  },
  /**
   * Given a DBPedia simplified structure, will return the list of secret
   * identities of the character.
   * @function getAuthors
   * @param  {object} data The simplified DBPedia data
   * @return {Array} The curated list of authors
   **/
  getSecretIdentities(data) {
    let secretIdentities = _.flatten([
      _.get(data, 'property.alterEgo', ''),
      _.get(data, 'property.fullName', ''),
      _.get(data, 'property.realName', '')
    ]);
    secretIdentities = Helper.cleanUpUrls(secretIdentities);
    secretIdentities = HelperString.splitOnCommas(secretIdentities);
    secretIdentities = HelperString.cleanUpList(secretIdentities);
    return secretIdentities;
  },
  /**
   * Given a DBPedia simplified structure, will return the list of aliases
   * @function getAliases
   * @param  {object} data The simplified DBPedia data
   * @param  {String} pageName Original Wikipedia page name
   * @return {Array} The curated list of aliases
   **/
  getAliases(data, pageName = '') {
    let aliases = _.compact(_.flatten([
      _.get(data, 'property.aliases', ''),
      _.get(data, 'property.characterName', ''),
      _.get(data, 'property.search', ''),
      _.get(data, 'property.sortkey', ''),
      _.get(data, 'property.title', ''),
      HelperWikipedia.readablePageName(pageName)
    ]));
    aliases = Helper.cleanUpUrls(aliases);
    aliases = HelperString.splitOnCommas(aliases);
    aliases = HelperString.cleanUpList(aliases);
    return aliases;
  },
  /**
   * Given a DBPedia simplified structure, will return the list of partners
   * @function getPartners
   * @param  {object} data The simplified DBPedia data
   * @return {Array} The curated list of partners
   **/
  getPartners(data) {
    let partners = _.get(data, 'property.partners', '');
    partners = Helper.cleanUpUrls(partners);
    partners = HelperString.splitOnCommas(partners);
    partners = HelperString.cleanUpList(partners);
    return partners;
  },
  /**
   * Given a DBPedia simplified structure, will return the list of teams
   * @function getTeams
   * @param  {object} data The simplified DBPedia data
   * @return {Array} The curated list of teams
   **/
  getTeams(data) {
    let teams = _.get(data, 'property.alliances', '');
    teams = Helper.cleanUpUrls(teams);
    teams = HelperString.splitOnCommas(teams);
    teams = HelperString.cleanUpList(teams);
    return teams;
  },
  /**
   * Given a DBPedia simplified structure, will return the list of species the
   * character belongs to
   * @function getSpecies
   * @param  {object} data The simplified DBPedia data
   * @return {Array} The curated list of species
   **/
  getSpecies(data) {
    let species = _.get(data, 'property.species', '');
    species = Helper.cleanUpUrls(species);
    species = HelperString.splitOnCommas(species);
    species = HelperString.multiSplit(species, '/');
    species = HelperString.cleanUpList(species);
    return species;
  },
  /**
   * Given a DBPedia simplified structure, will return the list of powers.
   * @function getPowers
   * @param  {object} data The simplified DBPedia data
   * @return {Array} The curated list of powers
   **/
  getPowers(data) {
    let powers = _.get(data, 'property.powers', '');
    powers = Helper.cleanUpUrls(powers);
    powers = HelperString.splitOnCommas(powers);
    powers = HelperString.multiSplit(powers, ';');
    powers = HelperString.cleanUpList(powers);
    powers = _.reject(powers, (power) => {
      return power.length > 25;
    });
    return powers;
  },
  /**
   * Returns true if the character is identified as a villain
   * @function isVillain
   * @param  {object} data The simplified DBPedia data
   * @return {Array} True if villain, false otherwise and null if unknown
   **/
  isVillain(data) {
    let isVillain = _.get(data, 'property.villain', null);
    if (isVillain === null) {
      return null;
    }
    return (isVillain === 'y');
  },
  /**
   * Returns true if the character is identified as a hero
   * @function isHero
   * @param  {object} data The simplified DBPedia data
   * @return {Array} True if hero, false otherwise and null if unknown
   **/
  isHero(data) {
    let isHero = _.get(data, 'property.hero', null);
    if (isHero === null) {
      return null;
    }
    return (isHero === 'y');
  }
};

export default Helper;
