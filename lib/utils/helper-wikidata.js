import _ from 'lodash';

const Helper = {
  /**
   * Check if the data returned by the API is missing
   * @function isReceivedDataMissing
   * @param  {object} receivedData Original data received
   * @return {Boolean} True if data is missing, false otherwise
   **/
  isReceivedDataMissing(receivedData) {
    return _.has(receivedData, 'entities.-1');
  },
  /**
   * Return all the aliases of a given Wikidata page
   * @function getAliases
   * @param  {object} data Original wikidata
   * @return {Array} Array of aliases
   **/
  getAliases(data) {
    if (!_.has(data, 'entities')) {
      return [];
    }
    // Finding the correct entity, holding the aliases
    let entity = _.find(data.entities, (item) => {
      return _.has(item, 'aliases');
    });
    if (!entity) {
      return [];
    }
    // No alias en english
    if (!_.has(entity.aliases, 'en')) {
      return [];
    }

    let aliases = _.map(entity.aliases.en, 'value');
    return aliases;
  }
};

export default Helper;
