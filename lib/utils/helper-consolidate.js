import _ from 'lodash';

const Helper = {
  /**
   * Check if two character names are the same.
   * ✓ Thor / Thor
   * ✓ Beetle / Beetle (Abner Jenkins)
   * ✓ Adrienne Frost / White Queen (Adrienne Frost)
   * @function isSameName
   * @param  {String} nameOne First name to compare
   * @param  {String} nameTwo Second name to compare
   * @return {Boolean} True if both names refer to the same character
   **/
  isSameName(nameOne, nameTwo) {
    // Exact match
    if (nameOne === nameTwo) {
      return true;
    }

    let nameTwoSplit = nameTwo.match(/^(.*) \((.*)\)$/);
    if (nameTwoSplit) {
      let mainName = nameTwoSplit[1];
      let parenthesisName = nameTwoSplit[2];
      let hasAMatch = (mainName === nameOne || parenthesisName === nameOne);
      if (hasAMatch) {
        return true;
      }
    }

    // Try in reverse
    let nameOneSplit = nameOne.match(/^(.*) \((.*)\)$/);
    if (nameOneSplit) {
      let mainName = nameOneSplit[1];
      let parenthesisName = nameOneSplit[2];
      let hasAMatch = (mainName === nameTwo || parenthesisName === nameTwo);
      if (hasAMatch) {
        return true;
      }
    }

    return false;
  },
  merge(data) {
    // Merge dbpedia and infoboxes into one object
    let wikipediaData = {};
    let commonKeysDbpediaInfobox = [
      'aliases',
      'authors',
      'teams',
      'description',
      'name',
      'secretIdentities',
      'species',
      'partners'
    ];
    _.each(commonKeysDbpediaInfobox, (key) => {
      let dbpediaValue = _.get(data, `dbpediaData.${key}`);
      let infoboxValue = _.get(data, `infoboxData.${key}`);
      // Take default value from dbpedia if a string
      if (_.isString(dbpediaValue || infoboxValue)) {
        wikipediaData[key] = dbpediaValue || infoboxValue;
        return;
      }
      // Merge arrays
      if (_.isArray(dbpediaValue || infoboxValue)) {
        wikipediaData[key] = _.uniq(_.flatten(_.compact([dbpediaValue, infoboxValue])));
        return;
      }
    });

    let name = _.get(data, 'marvelApiData.name') || wikipediaData.name;
    let description = _.get(data, 'marvelApiData.description') ||
                      wikipediaData.description;
    let aliases = _.uniq(_.compact(_.flatten([
      _.get(data, 'wikidataData.aliases', []),
      wikipediaData.aliases
    ])));

    let mergedData = {
      description,
      name,
      images: Helper.getImages(data),
      aliases,
      urls: {
        wikipedia: data.wikipediaUrl,
        marvel: _.get(data, 'marvelApiData.url')
      },
      ranking: {
        comicCount: _.get(data, 'marvelApiData.counts.comics', 0),
        eventCount: _.get(data, 'marvelApiData.counts.events', 0),
        storyCount: _.get(data, 'marvelApiData.counts.stories', 0),
        serieCount: _.get(data, 'marvelApiData.counts.series', 0),
        pageviewCount: _.get(data, 'pageviews.latest90', 0),
        pageviewRank: _.get(data, 'pageviews.rank', -1)
      },
      authors: _.get(wikipediaData, 'authors', []),
      teams: _.get(wikipediaData, 'teams', []),
      secretIdentities: _.get(wikipediaData, 'secretIdentities', []),
      partners: _.get(wikipediaData, 'partners', []),
      powers: Helper.getPowers(data),
      species: _.get(wikipediaData, 'species', []),
      isVillain: _.get(data, 'dbpediaData.isVillain', false),
      isHero: _.get(data, 'dbpediaData.isHero', false),
      mainColor: _.get(data, 'marvelWebsiteData.mainColor', null)
    };

    // Remove duplicates from arrays
    _.each(mergedData, (value, key) => {
      if (!_.isArray(value)) {
        return;
      }
      mergedData[key] = _.uniqWith(value, (a, b) => {
        return a.toLowerCase() === b.toLowerCase();
      });
    });

    return mergedData;
  },

  getImages(data) {
    let thumbnail = _.get(data, 'marvelApiData.image') ||
                _.get(data, 'imageData.url');
    let banner = _.get(data, 'marvelWebsiteData.featuredImage');
    let background = _.get(data, 'marvelWebsiteData.featuredBackground');

    return {
      thumbnail,
      banner,
      background
    };
  },

  getPowers(data) {
    let dbpediaValue = _.get(data, `dbpediaData.powers`);
    let infoboxValue = _.get(data, `infoboxData.powers`);
    let powers = _.compact(_.flatten([dbpediaValue, infoboxValue]));

    // Capitalize all the powers
    powers = _.map(powers, _.capitalize);

    powers = _.reject(powers, (power) => {
      // "Ability to..." is too generic
      if (_.startsWith(power, 'Ability to')) {
        return true;
      }
      // 'Transform into' has already been cut
      if (power === 'Transform into') {
        return true;
      }
      return false;
    });

    return _.uniq(powers);
  },

  /**
   * Given one character (during consolidation), will return the Marvel
   * character that match the most from the specified list.
   * @function pickDataForCharacter
   * @param  {Object} character Character object, during consolidation
   * @param  {Object} marvelList List of all marvel characters, with their names
   * as keys
   * @return {Object} Marvel data of the matching character
   **/
  pickDataForCharacter(character, marvelList) {
    let name = _.get(character, 'dbpediaData.name', '') ||
               _.get(character, 'infoboxData.name', '');

    let aliases = _.flatten(
                    _.get(character, 'dbpediaData.aliases', []),
                    _.get(character, 'infoboxData.aliases', [])
                  );

    if (!name && aliases.length === 0) {
      return null;
    }

    // Quick check to see if there is an exact match on the name
    if (_.has(marvelList, name)) {
      return marvelList[name];
    }

    // Check if we can find and extended name
    let foundInName = _.find(marvelList, (marvelValue, marvelName) => {
      return Helper.isSameName(name, marvelName);
    });
    if (foundInName) {
      return foundInName;
    }

    // Check if we can do the same in the aliases
    let foundInAliases = null;
    _.each(aliases, (alias) => {
      if (foundInAliases) {
        return;
      }

      foundInAliases = _.find(marvelList, (marvelValue, marvelName) => {
        return Helper.isSameName(alias, marvelName);
      });
    });
    if (foundInAliases) {
      return foundInAliases;
    }

    return null;
  }
};

export default Helper;
