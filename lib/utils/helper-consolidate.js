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
    let name = _.get(data, 'marvelData.name') ||
               _.get(data, 'dbpediaData.name');

    let description = _.get(data, 'marvelData.description') ||
                      _.get(data, 'dbpediaData.description');


    let image = _.get(data, 'marvelData.image') ||
                _.get(data, 'imageData.url');

    let aliases = _.uniq(_.flatten([
      _.get(data, 'marvelData.aliases', []),
      _.get(data, 'wikidataData.aliases', [])
    ]));

    return {
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
      alliances: _.get(data, 'dbpediaData.alliances', []),
      secretIdentities: _.get(data, 'dbpediaData.secretIdentities', []),
      authors: _.get(data, 'dbpediaData.authors', []),
      partners: _.get(data, 'dbpediaData.partners', []),
      powers: _.get(data, 'dbpediaData.powers', []),
      species: _.get(data, 'dbpediaData.species', []),
      isVillain: _.get(data, 'dbpediaData.isVillain', false),
      isHero: _.get(data, 'dbpediaData.isHero', false)
    }
  }
};

export default Helper;
