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
    let name = Helper.getName(simplifiedData, pageName);
    // Unable to find a suitable name, so this might be a page listing all
    // characters of a secondary team, like
    // https://en.wikipedia.org/wiki/Children_of_the_Vault#Members
    if (!name) {
      return null;
    }


    let aliases = Helper.getAliases(simplifiedData, pageName);
    let alliances = Helper.getAlliances(simplifiedData);
    let authors = Helper.getAuthors(simplifiedData);
    let isHero = Helper.isHero(simplifiedData);
    let isVillain = Helper.isVillain(simplifiedData);
    let partners = Helper.getPartners(simplifiedData);
    let powers = Helper.getPowers(simplifiedData);
    let secretIdentities = Helper.getSecretIdentities(simplifiedData);
    let species = Helper.getSpecies(simplifiedData);

    // We keep only what we need
    let recordData = {
      description: _.get(simplifiedData, 'ontology.abstract'),
      wikipediaId: _.get(simplifiedData, 'ontology.wikiPageID'),
      // Names
      aliases,
      name,
      secretIdentities,
      // Facets
      alliances,
      authors,
      partners,
      powers,
      species,
      // Villain/Hero
      isVillain,
      isHero,
      // simplifiedData
    };

    return recordData;
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
   * Given a DBPedia simplified structure, will return the list of authors.
   * @function getAuthors
   * @param  {object} data The simplified DBPedia data
   * @return {Array} The curated list of authors
   **/
  getAuthors(data) {
    let authors = _.get(data, 'property.creators');
    authors = Helper.cleanUpUrls(authors);
    authors = HelperString.multiSplit(authors,
                                      ', ',
                                      ' and ',
                                      ' and',
                                      '\n');

    // Specifically handle "John Romita, Jr."
    let mergedAuthors = [];
    _.each(authors, (author) => {
      if (author !== 'Jr.') {
        return mergedAuthors.push(author);
      }
      let lastIndex = mergedAuthors.length - 1;
      let lastAuthor = mergedAuthors[lastIndex];
      mergedAuthors[lastIndex] = `${lastAuthor}, Jr.`;
    });
    authors = mergedAuthors;

    // Cleanup each author
    authors = _.map(authors, (author) => {
      author = _.trimStart(author, '*');
      author = _.trimEnd(author, ',');
      author = author.trim();
      return author;
    });

    // Remove empty keys and uniq
    authors = _.uniq(_.compact(authors));

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
    secretIdentities = HelperString.multiSplit(secretIdentities,
                                               ' and ',
                                               ', ');

    // Cleanup each secret identity
    secretIdentities = _.map(secretIdentities, (secretIdentity) => {
      secretIdentity = secretIdentity.replace(/^- /, '');
      return secretIdentity;
    });

    // Remove empty keys and uniq
    secretIdentities = _.uniq(_.compact(secretIdentities));

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
    aliases = HelperString.multiSplit(aliases, ', ');

    // Cleanup each alias
    aliases = _.map(aliases, (alias) => {
      alias = alias.replace(/^\[\[\#/, '');
      return alias;
    });

    // Remove empty keys and uniq
    aliases = _.uniq(_.compact(aliases));

    return aliases;
  },

  /**
   * Given a DBPedia simplified structure, will return the list of partners
   * @function getPartners
   * @param  {object} data The simplified DBPedia data
   * @return {Array} The curated list of partners
   **/
  getPartners(data) {
    let partners = _.flatten([
      _.get(data, 'property.partners', '')
    ]);
    partners = Helper.cleanUpUrls(partners);
    partners = HelperString.multiSplit(partners, '\n');

    // Cleanup each partner
    partners = _.map(partners, (partner) => {
      partner = _.trimStart(partner, '*');
      partner = _.trim(partner);
      return partner;
    });

    // Remove empty keys and uniq
    partners = _.uniq(_.compact(partners));

    return partners;
  },
  /**
   * Given a DBPedia simplified structure, will return the list of alliances
   * @function getAlliances
   * @param  {object} data The simplified DBPedia data
   * @return {Array} The curated list of alliances
   **/
  getAlliances(data) {
    let alliances = _.get(data, 'property.alliances');
    alliances = Helper.cleanUpUrls(alliances);
    alliances = HelperString.multiSplit(alliances, '\n');

    // Cleanup each author
    alliances = _.map(alliances, (alliance) => {
      alliance = alliance.replace(/^\*/, '');
      alliance = alliance.trim();
      return alliance;
    });

    // Remove empty keys and uniq
    alliances = _.uniq(_.compact(alliances));

    return alliances;
  },

  /**
   * Given a DBPedia simplified structure, will return the list of species the
   * character belongs to
   * @function getSpecies
   * @param  {object} data The simplified DBPedia data
   * @return {Array} The curated list of species
   **/
  getSpecies(data) {
    let species = _.flatten([
      _.get(data, 'property.species', '')
    ]);
    species = Helper.cleanUpUrls(species);
    species = HelperString.multiSplit(species, '/');

    // Remove empty keys and uniq
    species = _.uniq(_.compact(species));

    return species;
  },


  /**
   * Given a DBPedia simplified structure, will return the list of powers.
   * @function getPowers
   * @param  {object} data The simplified DBPedia data
   * @return {Array} The curated list of powers
   **/
  getPowers(data) {
    let powers = _.get(data, 'property.powers');
    powers = Helper.cleanUpUrls(powers);
    powers = HelperString.multiSplit(powers,
                                     '\n',
                                     ';',
                                     ' and ',
                                     ', ');

    // Remove some powers
    powers = _.reject(powers, (power) => {
      // Remove "Armor grants:", "Formerly:" lines
      if (power.match(/:$/)) {
        return true;
      }
      // Keep empty if no powers
      if (power === 'None') {
        return true;
      }

      return false;
    });

    // Cleanup each power
    powers = _.map(powers, (power) => {
      power = power.replace(/,$/, '');
      power = power.replace(/^\*/, '');
      power = power.trim();
      if (power === "'") {
        return null;
      }
      return power;
    });

    // Remove empty keys and uniq
    powers = _.uniq(_.compact(powers));

    return powers;
  },

  isVillain(data) {
    let isVillain = _.get(data, 'property.villain');
    return (isVillain === 'y');
  },

  isHero(data) {
    let isHero = _.get(data, 'property.hero');
    return (isHero === 'y');
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
  }
};

export default Helper;
