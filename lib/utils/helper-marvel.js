import URL from 'fast-url-parser';
import _ from 'lodash';

const Helper = {
  /**
   * The API can return wrongly encoded strings (seems to be encoded in UTF-8
   * twice). This method will try to revert it
   * @function fixBadEncoding
   * @param  {String} input The potentially wrongly encoded input
   * @return {String} The fixed string
   **/
  fixBadEncoding(input) {
    if (!_.isString(input)) {
      return input;
    }

    return input.replace(/ï¿½/g, "'");
  },
  /**
   * Given a raw Marvel dump returned by the API, return only the needed data
   * for a record
   * @function getRecordData
   * @param  {Object} rawData The data, as received from the API
   * @return {Object} The curated version of the data
   **/
  getRecordData(rawData) {
    let name = _.get(rawData, 'name');

    if (Helper.isWrongUniverse(name)) {
      return null;
    }

    let description = Helper.getDescription(rawData);
    let image = Helper.getImage(rawData);
    if (!description && !image) {
      return null;
    }

    let counts = Helper.getCounts(rawData);
    let url = Helper.getUrl(rawData);

    // We keep only what we need
    let recordData = {
      name,
      counts,
      description,
      image,
      url,
      marvelId: _.get(rawData, 'id')
    };

    return recordData;
  },
  /**
   * Returns true if the specified character name is not from the correct
   * universe
   * @function isWrongUniverse
   * @param  {Object} name The character name
   * @return {Object} True if not from the correct universe
   **/
  isWrongUniverse(name) {
    if (name.match(/\(LEGO Marvel/)) {
      return true;
    }
    if (name.match(/\(Ultimate\)/)) {
      return true;
    }
    if (name.match(/\(2099\)/)) {
      return true;
    }
    return false;
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

    return Helper.fixBadEncoding(description);
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

    // Urls targeting /comics/characters are not interesting at all
    if (url.match(/comics\/characters/)) {
      return null;
    }

    let parsedUrl = URL.parse(url, true);
    parsedUrl.search = null;
    parsedUrl.query = null;
    return URL.format(parsedUrl);
  }
};

export default Helper;
