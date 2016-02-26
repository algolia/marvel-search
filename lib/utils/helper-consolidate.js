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
      'partners',
      'powers'
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

    let name = _.get(data, 'marvelData.name') || wikipediaData.name;
    let description = _.get(data, 'marvelData.description') ||
                      wikipediaData.description;
    let image = _.get(data, 'marvelData.image') ||
                _.get(data, 'imageData.url');
    let aliases = _.uniq(_.compact(_.flatten([
      _.get(data, 'wikidataData.aliases', []),
      wikipediaData.aliases
    ])));

    let mergedData = {
      description,
      name,
      image,
      aliases,
      urls: {
        wikipedia: data.wikipediaUrl,
        marvel: _.get(data, 'marvelData.url')
      },
      ranking: {
        comicCount: _.get(data, 'marvelData.counts.comics', 0),
        eventCount: _.get(data, 'marvelData.counts.events', 0),
        storyCount: _.get(data, 'marvelData.counts.stories', 0),
        serieCount: _.get(data, 'marvelData.counts.series', 0),
        pageviewCount: _.get(data, 'pageviews.latest90', 0),
        pageviewRank: _.get(data, 'pageviews.rank', -1)
      },
      authors: _.get(wikipediaData, 'authors', []),
      teams: _.get(wikipediaData, 'teams', []),
      secretIdentities: _.get(wikipediaData, 'secretIdentities', []),
      partners: _.get(wikipediaData, 'partners', []),
      powers: _.get(wikipediaData, 'powers', []),
      species: _.get(wikipediaData, 'species', []),
      isVillain: _.get(data, 'dbpediaData.isVillain', false),
      isHero: _.get(data, 'dbpediaData.isHero', false)
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
  }
};

export default Helper;
