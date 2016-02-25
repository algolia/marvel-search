import URL from 'fast-url-parser';
import _ from 'lodash';
import HelperConsolidate from './helper-consolidate.js';

// Grab more data from the Marvel API?
// Grab the background image of each hero, the one with cases
// http://x.annihil.us/u/prod/marvel/i/mg/c/00/537bbee3e2f11.gif

const Helper = {
  /**
   * Given a raw Marvel dump returned by the API, return only the needed data
   * for a record
   * @function getRecordData
   * @param  {Object} rawData The data, as received from the API
   * @return {Object} The curated version of the data
   **/
  getRecordData(rawData) {
    let counts = Helper.getCounts(rawData);
    let description = Helper.getDescription(rawData);
    let image = Helper.getImage(rawData);
    let url = Helper.getUrl(rawData);

    // We keep only what we need
    let recordData = {
      counts,
      description,
      image,
      url,
      marvelId: _.get(rawData, 'id'),
      name: _.get(rawData, 'name')
    };

    return recordData;
  },
  /**
   * Returns an object holding the count of all comics, events, stories and
   * series the character has been involved in.
   * @function getCounts
   * @param  {Object} data The data, as received from the API
   * @return {Object} An object holding all the counts
   **/
  getCounts(data) {
    return {
      comics: _.get(data, 'comics.available', 0),
      events: _.get(data, 'events.available', 0),
      stories: _.get(data, 'stories.available', 0),
      series: _.get(data, 'series.available', 0)
    };
  },
  /**
   * Returns the description of the character.
   * @function getDescription
   * @param  {Object} data The data, as received from the API
   * @return {Object} Textual description of the character
   **/
  getDescription(data) {
    let description = _.get(data, 'description', '').trim();
    if (!description) {
      return null;
    }
    return description;
  },
  /**
   * Returns the url to access the character picture
   * @function getImage
   * @param  {Object} data The data, as received from the API
   * @return {Object} Url to the character picture
   **/
  getImage(data) {
    let extension = _.get(data, 'thumbnail.extension');
    let url = _.get(data, 'thumbnail.path');
    if (url.match(/image_not_available/)) {
      return null;
    }

    return `${url}/standard_xlarge.${extension}`;
  },
  /**
   * Returns the url to the Marvel official webpage
   * @function getUrl
   * @param  {Object} data The data, as received from the API
   * @return {String} Url to the character page on the Marvel website
   **/
  getUrl(data) {
    let url = _.find(_.get(data, 'urls'), {type: 'detail'}).url;

    let parsedUrl = URL.parse(url, true);
    parsedUrl.search = null;
    parsedUrl.query = null;
    return URL.format(parsedUrl);
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
      return HelperConsolidate.isSameName(name, marvelName);
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
        return HelperConsolidate.isSameName(alias, marvelName);
      });
    });
    if (foundInAliases) {
      return foundInAliases;
    }

    return null;
  }
};

export default Helper;
