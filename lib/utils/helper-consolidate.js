import _ from 'lodash';
import HelperMarvel from './helper-marvel.js';

const Helper = {
  customIdentityRegexp: /^(.*) \((.*)\)$/,
  /**
   * Returns true if a given name is a custom identity of a specific character.
   * Names in the form of "SuperName (Real Name)" are custom identities
   * @function isCustomIdentityName
   * @param  {String} name Character name
   * @return {Boolean} True if custom identity name
   **/
  isCustomIdentityName(name) {
    return Helper.customIdentityRegexp.test(name);
  },

  /**
   * Returns an object with the `superName` and `realName` keys extracted from
   * the character name
   * @function getCustomIdentity
   * @param  {String} name Character name
   * @return {Object} Object containing the `superName` and `realName`
   **/
  getCustomIdentity(name) {
    if (!Helper.isCustomIdentityName(name)) {
      return {
        superName: name,
        realName: null
      };
    }
    let match = name.match(Helper.customIdentityRegexp);
    return {
      superName: match[1],
      realName: match[2]
    };
  },

  /**
   * Checks if a given name is "loosely" equal to another.
   * In addition to an exact match of the string, it will also return true if
   * all the words of the string can be found in the other string.
   * Example:
   *    isLooselyEqual('Trey Rollins', 'Trey Jason Rollins') => true
   * @function isLooselyEqual
   * @param  {String} input Any string to find
   * @param  {String} comparison Any string to compare
   * @return {Boolean} True if the input is loosely equal to the comparison
   **/
  isLooselyEqual(input, comparison) {
    if (!input || !comparison) {
      return false;
    }
    if (comparison === input) {
      return true;
    }

    let inputWords = input.split(' ');
    let comparisonWords = comparison.split(' ');
    let wordCount = inputWords.length;
    return _.intersection(inputWords, comparisonWords).length === wordCount;
  },
  /**
   * Checks if a given name is "loosely" included in an array of string.
   * In addition to an exact match of the string, it will also return true if
   * all the words of the string can be found in any of the list array.
   * Example:
   *    isLooselyIncluded("Trey Rollins", ['Trey Jason Rollins']) => true
   * @function isLooselyIncluded
   * @param  {String} input Any string to find
   * @param  {Array} list Array of strings to search into
   * @return {Boolean} True if the input can be loosely found in the list
   **/
  isLooselyIncluded(input, list) {
    return _.some(list, (item) => {
      return Helper.isLooselyEqual(input, item);
    });
  },

  /**
   * Given one character (during consolidation), will return the Marvel
   * character that match the most from the specified list.
   * @function pickDataForCharacter
   * @param  {Object} character Character object, during consolidation
   * @param  {Object} marvelList List of all marvel characters, with their names
   * as keys
   * @return {Object} Marvel data of the matching character. It also adds a new
   * field, named `pickType` with one of the following values:
   * - `exactMatch` when we had a character with the exact same name
   *    Abomination
   *       <=>
   *    Abomination
   *
   * - `secretIdentity` when the marvel name was giving a secondary identity
   *   that was one of the secret identity / aliases
   *   Aegis (with a secret identity of "Trey Jason Rollins")
   *      <=>
   *   Aegis (Trey Rollins)
   *
   * - `realName` when the wiki name is only found as a secondary identity of
   *   the marvel one
   *   Eric O'Grady
   *     <=>
   *   Ant-Man (Eric O'Grady)
   *
   *  - `looseMatch` when both title have a secret identity that loosely match
   *  Black Knight (Sir Percy)
   *     <=>
   *  Black Knight (Sir Percy of Scandia)
   *
   *  - `mainCharacterFallback` when the wiki includes a specific identity but
   *  we have no marvel data for it, we instead use the generic character data
   *  if any
   *  Black Widow (Claire Voyant)
   *     <=>
   *  Black Widow (because we have nothing more specific)
   **/
  pickDataForCharacter(character, marvelList) {
    let fullName = _.get(character, 'infoboxData.name');
    let foundCharacter = false;

    // TYPE: exactMatch
    //    Abomination
    //       <=>
    //    Abomination
    if (_.has(marvelList, fullName)) {
      return {
        ...marvelList[fullName],
        pickType: 'exactMatch'
      };
    }

    let {superName, realName} = Helper.getCustomIdentity(fullName);
    let marvelKeys = _.keys(marvelList);

    // TYPE: secretIdentity
    //   Aegis (with a secret identity of "Trey Jason Rollins")
    //      <=>
    //   Aegis (Trey Rollins)
    let reducedList = _.filter(marvelKeys, (key) => {
      return _.startsWith(key, `${superName} (`);
    });

    let secretIdentities = _.union(
      _.get(character, 'dbpediaData.secretIdentities', []),
      _.get(character, 'infoboxData.secretIdentities', []),
      _.get(character, 'dbpediaData.aliases', []),
      _.get(character, 'infoboxData.aliases', [])
    );

    // Check in all aliases if the real name is found
    // We need to keep count of how many characters could match, because we will
    // apply it only if there is one match. If several matches, we have the risk
    // of applying the wrong one.
    let possibleMatchesCount = 0;
    _.each(reducedList, (marvelName) => {
      let {realName: marvelRealName} = Helper.getCustomIdentity(marvelName);

      // Marvel real name exactly found
      if (Helper.isLooselyIncluded(marvelRealName, secretIdentities)) {
        possibleMatchesCount++;
        foundCharacter = {
          ...marvelList[marvelName],
          pickType: 'secretIdentity'
        };
      }
    });
    if (foundCharacter && possibleMatchesCount === 1) {
      return foundCharacter;
    }
    foundCharacter = false;

    // TYPE: realName
    //   Eric O'Grady
    //     <=>
    //   Ant-Man (Eric O'Grady)
    if (!realName) {
      _.each(marvelKeys, (marvelName) => {
        if (_.endsWith(marvelName, `(${superName})`)) {
          foundCharacter = {
            ...marvelList[marvelName],
            pickType: 'realName'
          };
          return false;
        }
      });
    }
    if (foundCharacter) {
      return foundCharacter;
    }

    // TYPE: looseMatch
    //  Black Knight (Sir Percy)
    //     <=>
    //  Black Knight (Sir Percy of Scandia)
    if (realName) {
      _.each(reducedList, (marvelName) => {
        let {realName: marvelRealName} = Helper.getCustomIdentity(marvelName);
        if (Helper.isLooselyEqual(realName, marvelRealName)) {
          foundCharacter = {
            ...marvelList[marvelName],
            pickType: 'looseMatch'
          };
        }
      });
      if (foundCharacter) {
        return foundCharacter;
      }
    }

    // TYPE: mainCharacterFallback
    // Black Widow (Claire Voyant)
    //   <=>
    // Black Widow
    if (realName && _.has(marvelList, superName)) {
      return {
        ...marvelList[superName],
        pickType: 'mainCharacterFallback'
      };
    }

    return null;
  },

  /**
   * Takes the name in the following order:
   * - In the Infobox
   * - In the DBPedia
   * Uses Marvel name if more precise
   * @function getName
   * @param  {Object} data Raw object data
   * @return {String} Name of the record
   **/
  getName(data) {
    let marvelApiPickType = _.get(data, 'marvelApiData.pickType');
    // If the main name is a secret identity and the Marvel API has a full
    // custom identity name, better user use that one.
    if (marvelApiPickType === 'realName') {
      return _.get(data, 'marvelApiData.name');
    }

    return _.get(data, 'infoboxData.name') ||
           _.get(data, 'dbpediaData.name');
  },

  /**
   * Character superhero name, without custom secret identity
   * @function getSuperName
   * @param  {Object} data Raw object data
   * @return {String} Name of the "in costume" character
   **/
  getSuperName(data) {
    let name = Helper.getName(data);
    let {superName} = Helper.getCustomIdentity(name);
    return superName;
  },

  /**
   * Takes the description in the following order:
   * - In the Marvel API description (only if more specific)
   * - In the Marvel website description (only if more specific)
   * - In the Infobox
   * - In the DBPedia
   * @function getDescription
   * @param  {Object} data Raw object data
   * @return {String} Name of the record
   **/
  getDescription(data) {
    let marvelWebsiteDescription = _.get(data, 'marvelWebsiteData.description');
    let marvelApiDescription = HelperMarvel.fixBadEncoding(_.get(data, 'marvelApiData.description'));
    let infoboxDescription = _.get(data, 'infoboxData.description');
    let dbpediaDescription = _.get(data, 'dbpediaData.description');
    let isWebsiteTooGeneric = _.get(data, 'marvelWebsiteData.pickType') === 'mainCharacterFallback';
    let isApiTooGeneric = _.get(data, 'marvelApiData.pickType') === 'mainCharacterFallback';

    // Using marvel API or website description if targets the exact same
    // character
    if (!isApiTooGeneric && marvelApiDescription) {
      return marvelApiDescription;
    }
    if (!isWebsiteTooGeneric && marvelWebsiteDescription) {
      return marvelWebsiteDescription;
    }

    // Using infobox or dbpedia description if found 
    if (infoboxDescription) {
      return infoboxDescription;
    }
    if (dbpediaDescription) {
      return dbpediaDescription;
    }

    // Using marvel API or website description as fallback only if they target
    // a more generic character
    if (isApiTooGeneric && marvelApiDescription) {
      return marvelApiDescription;
    }
    if (isWebsiteTooGeneric && marvelWebsiteDescription) {
      return marvelWebsiteDescription;
    }

    return null;
  },

  /**
   * Merges all aliases from infobox, dbpedia and wikidata
   * @function getAliases
   * @param  {Object} data Raw object data
   * @return {String} List of aliases of the record
   **/
  getAliases(data) {
    let infoboxAliases = _.get(data, 'infoboxData.aliases');
    let dbpediaAliases = _.get(data, 'dbpediaData.aliases');
    let wikidataAliases = _.get(data, 'wikidataData.aliases');

    return _.uniq(_.union(
      infoboxAliases,
      dbpediaAliases,
      wikidataAliases
    ));
  },

  /**
   * Merges all authors from infobox and dbpedia
   * @function getAuthors
   * @param  {Object} data Raw object data
   * @return {String} List of authors of the record
   **/
  getAuthors(data) {
    let infoboxAuthors = _.get(data, 'infoboxData.authors');
    let dbpediaAuthors = _.get(data, 'dbpediaData.authors');

    return _.uniq(_.union(
      infoboxAuthors,
      dbpediaAuthors
    ));
  },

  /**
   * Merges all teams from infobox and dbpedia
   * @function getTeams
   * @param  {Object} data Raw object data
   * @return {String} List of teams of the record
   **/
  getTeams(data) {
    let infoboxTeams = _.get(data, 'infoboxData.teams');
    let dbpediaTeams = _.get(data, 'dbpediaData.teams');

    return _.uniq(_.union(
      infoboxTeams,
      dbpediaTeams
    ));
  },

  /**
   * Merges all secret identities from infobox and dbpedia
   * @function getSecretIdentities
   * @param  {Object} data Raw object data
   * @return {String} List of secret identities of the record
   **/
  getSecretIdentities(data) {
    let infoboxSecretIdentities = _.get(data, 'infoboxData.secretIdentities');
    let dbpediaSecretIdentities = _.get(data, 'dbpediaData.secretIdentities');

    return _.uniq(_.union(
      infoboxSecretIdentities,
      dbpediaSecretIdentities
    ));
  },

  /**
   * Merges all species from infobox and dbpedia
   * @function getSpecies
   * @param  {Object} data Raw object data
   * @return {String} List of species of the record
   **/
  getSpecies(data) {
    let infoboxSpecies = _.get(data, 'infoboxData.species');
    let dbpediaSpecies = _.get(data, 'dbpediaData.species');

    return _.uniq(_.union(
      infoboxSpecies,
      dbpediaSpecies
    ));
  },

  /**
   * Merges all partners from infobox and dbpedia
   * @function getPartners
   * @param  {Object} data Raw object data
   * @return {String} List of partners of the record
   **/
  getPartners(data) {
    let infoboxPartners = _.get(data, 'infoboxData.partners');
    let dbpediaPartners = _.get(data, 'dbpediaData.partners');

    return _.uniq(_.union(
      infoboxPartners,
      dbpediaPartners
    ));
  },

  /**
   * Gets the character thumbnail from the following sources:
   * - Marvel website
   * - Marvel API
   * - Wikipedia
   * If the Marvel data is the generic character while the main data is for
   * a specific version, we use the main thumbnail
   * @function getThumbnail
   * @param  {Object} data Raw object data
   * @return {String} Character thumbnail url
   **/
  getThumbnail(data) {
    let marvelWebsiteThumbnail = _.get(data, 'marvelWebsiteData.thumbnail');
    let marvelApiThumbnail = _.get(data, 'marvelApiData.image');
    let wikiThumbnail = _.get(data, 'imageData.url');
    let isWebsiteTooGeneric = _.get(data, 'marvelWebsiteData.pickType') === 'mainCharacterFallback';
    let isApiTooGeneric = _.get(data, 'marvelApiData.pickType') === 'mainCharacterFallback';

    // The website target the same character as the wiki:
    if (!isWebsiteTooGeneric && marvelWebsiteThumbnail) {
      return marvelWebsiteThumbnail;
    }

    // The API targets the same character as the wiki:
    if (!isApiTooGeneric && marvelApiThumbnail) {
      return marvelApiThumbnail;
    }

    // Wiki image, to be used as last fallback if we have a good match in the
    // Marvel website/API, or as first try if we have a bad match
    if (wikiThumbnail) {
      return wikiThumbnail;
    }

    // No wiki, image let's use the website generic one
    if (marvelWebsiteThumbnail) {
      return marvelWebsiteThumbnail;
    }

    // No Wiki and no website image, let's use the generic API one
    if (marvelApiThumbnail) {
      return marvelApiThumbnail;
    }

    return null;
  },

  /**
   * Gets the character background image
   * - Marvel website
   * @function getBackgroundImage
   * @param  {Object} data Raw object data
   * @return {String} Character background image url
   **/
  getBackgroundImage(data) {
    return _.get(data, 'marvelWebsiteData.featuredBackground', null);
  },

  /**
   * Gets the character powers from the following sources:
   * - DBPedia
   * - Infoboxes
   * @function getPowers
   * @param  {Object} data Raw object data
   * @return {String} Character powers
   **/
  getPowers(data) {
    let dbpediaValue = _.get(data, `dbpediaData.powers`);
    let infoboxValue = _.get(data, `infoboxData.powers`);
    let powers = _.union(dbpediaValue, infoboxValue);

    // Capitalize all the powers
    powers = _.uniq(_.map(powers, _.capitalize));

    return powers;
  },

  /**
   * Gets the character main color from the website
   * @function getMainColor
   * @param  {Object} data Raw object data
   * @return {String} Character main color
   **/
  getMainColor(data) {
    return _.get(data, 'marvelWebsiteData.mainColor', null);
  },

  /**
   * Gets the urls to the source websites
   * @function getUrls
   * @param  {Object} data Raw object data
   * @return {String} Character wikipedia and marvel url
   **/
  getUrls(data) {
    let wikipediaUrl = data.wikipediaUrl;
    let marvelUrl = _.get(data, 'marvelWebsiteData.url', null) ||
                    _.get(data, 'marvelApiData.url', null);
    return {
      wikipedia: wikipediaUrl,
      marvel: marvelUrl
    };
  },

  /**
   * Gets the custom ranking values
   * @function getRanking
   * @param  {Object} data Raw object data
   * @return {String} Character various scores for ranking
   **/
  getRanking(data) {
    let comicCount = _.get(data, 'marvelApiData.counts.comics', 0);
    let eventCount = _.get(data, 'marvelApiData.counts.events', 0);
    let storyCount = _.get(data, 'marvelApiData.counts.stories', 0);
    let serieCount = _.get(data, 'marvelApiData.counts.series', 0);
    let pageviewCount = _.get(data, 'pageviews.latest90', 0);
    return {
      comicCount,
      eventCount,
      storyCount,
      serieCount,
      pageviewCount
    };
  },

  /**
   * Given a structure of all the data from all the sources, returns
   * a simplified record, ready to be pushed and searched
   * @function merge
   * @param  {Object} data Raw object data
   * @return {Object} Simplified structure, aggregated from all sources
   */
  merge(data) {
    return {
      aliases: Helper.getAliases(data),
      authors: Helper.getAuthors(data),
      description: Helper.getDescription(data),
      images: {
        thumbnail: Helper.getThumbnail(data),
        background: Helper.getBackgroundImage(data)
      },
      mainColor: Helper.getMainColor(data),
      name: Helper.getName(data),
      partners: Helper.getPartners(data),
      powers: Helper.getPowers(data),
      ranking: Helper.getRanking(data),
      secretIdentities: Helper.getSecretIdentities(data),
      superName: Helper.getSuperName(data),
      species: Helper.getSpecies(data),
      teams: Helper.getTeams(data),
      urls: Helper.getUrls(data)
    };
  }
};

export default Helper;
