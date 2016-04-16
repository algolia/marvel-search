import _ from 'lodash';

const Helper = {
  SPECIFIC_TITLES: ['Jr.', 'Sr.'],
  /**
   * Splits a string into an array, on specified separators
   * multiSplit("Huey, Dewey and Louie", ", ", " and ")
   * ['Huey', 'Dewey', 'Louie']
   * @function multiSplit
   * @param  {string|Array} input Input string to split or array of strings to
   * split
   * @param  {...string} separators String separator on which to split the string
   * @return {Array} Array of parts
   **/
  multiSplit(input, ...separators) {
    // Quick fail if data is empty
    if (!input) {
      return [];
    }

    let results;
    let tmp = [];
    if (_.isArray(input)) {
      results = _.flatten(input);
    } else {
      results = [input];
    }

    // Force all content as string
    results = _.map(results, _.toString);

    _.each(separators, (separator) => {
      // We split each element in the current results according to the split and
      // we add it to the tmp
      _.each(results, (item) => {
        tmp.push.apply(tmp, item.split(separator));
      });
      results = tmp;
      tmp = [];
    });
    return _.compact(results);
  },
  /**
   * Returns the true if the specified string ends with any of the specified
   * words
   * @function endsWithAnyOf
   * @param  {string} input Input text
   * @param  {string} suffixes List of suffix to test
   * @return {Boolean} True if input ends with one of the suffixes
   **/
  endsWithAnyOf(input, suffixes) {
    return !_.every(suffixes, (suffix) => {
      return !_.endsWith(input, suffix);
    });
  },
  /**
   * Returns the first sentence of a long string.
   * @function firstSentence
   * @param  {string} input Input text
   * @return {string} First sentence of the text
   **/
  firstSentence(input) {
    if (!input) {
      return null;
    }

    let knownTitles = [
      'Mr.', 'Mrs.', 'Ph.D.', 'e.g.', 'aka.', 'Dr.', 'Inc.', 'St.',
      'P. ', 'J. '
    ];
    // Encode known false-positives
    _.each(knownTitles, (title) => {
      input = input.replace(title, title.replace('.', '{{#}}'));
    });

    // Split on each sentence
    let sentenceSplitter = /\.( +)([A-Z])/;
    let split = input.split(sentenceSplitter);
    // Null if no result
    if (split.length === 0) {
      return null;
    }

    // Return only first sentence, with trailing dot
    let description = split[0];

    // Decode known false-positive
    _.each(knownTitles, (title) => {
      description = description.replace(title.replace('.', '{{#}}'), title);
    });

    let lastChar = description[description.length - 1];
    if (lastChar !== '.') {
      description = `${description}.`;
    }
    return description;
  },
  /**
   * Given a string or array of elements, will clean it to remove any unusable
   * value, clean each individual one and return an array with uniqued values.
   * @function cleanUpList
   * @param  {String|Array} data String or Array to clean
   * @return {Array} Clean array
   **/
  cleanUpList(data, previousLength = null) {
    data = Helper.splitOnCommonSeparators(data);
    let currentLength = data.length;

    data = Helper.trimItemsInList(data);
    data = Helper.rejectBadItemsInList(data);
    data = _.uniq(_.compact(data));

    // Start again if we managed to change something
    if (previousLength !== currentLength) {
      return Helper.cleanUpList(data, currentLength);
    }
    return data;
  },
  /**
   * Will split a string or array on commas, making sure it correctly handles
   * specific cases likes "John Romita, Jr."
   * @function splitOnCommas
   * @param  {String|Array} data String or Array to split
   * @return {Array} Split array
   **/
  splitOnCommas(data) {
    let splitCharacters = [
      ',',
      ' and ',
      /^and /,
      / and$/
    ];
    data = _.map(Helper.multiSplit(data, ...splitCharacters), _.trim);

    let cleanedData = [];
    _.each(data, (item) => {
      if (!_.includes(Helper.SPECIFIC_TITLES, item)) {
        return cleanedData.push(item);
      }
      let lastIndex = cleanedData.length - 1;
      let lastItem = cleanedData[lastIndex];
      cleanedData[lastIndex] = `${lastItem}, ${item}`;
    });

    return cleanedData;
  },
  /**
   * Will split a string or array on common separators usually found in markup
   * (like new lines, bullet points, etc). Note that this purposefully
   * does not split on commas because for some values we might want to keep the
   * comma in the final values.
   * @function splitOnCommonSeparators
   * @param  {String|Array} data String or Array to split
   * @return {Array} Split array
   **/
  splitOnCommonSeparators(data) {
    let splitSeparators = [
      '<br>',
      '<BR>',
      '<br/>',
      '<br />',
      '\n',
      '*'
    ];
    data = Helper.multiSplit(data, ...splitSeparators);
    return _.map(data, _.trim);
  },
  /**
   * Given a string or array of elements, will trim any unwanted characters
   * @function trimItemsInList
   * @param  {String|Array} data String or Array to trim
   * @return {Array} Trimmed array
   **/
  trimItemsInList(data) {
    let nicknames = [];
    let trimmedData = _.map(data, (item) => {
      item = _.trim(item, '{},*"/');
      item = item.replace(/\+/g, ' ');
      item = item.replace(/^\[\[\#/, '');
      item = item.replace(/'''/g, '').replace(/'''$/, '');
      item = item.replace(/^- /, '');
      item = item.replace(/<ref>(.*?)<\/ref>/g, '');
      item = item.replace(/<ref name$/g, '');
      item = item.replace(/<ref>([^<]*)/g, '');
      item = item.replace(/^(.*): (.*)/, '$2');

      // Trim the dots if does not ends with one of the Sr., Jr. specific
      // strings
      if (!Helper.endsWithAnyOf(item, Helper.SPECIFIC_TITLES)) {
        item = _.trim(item, '.');
      }

      item = _.trim(item);

      // Extracting nicknames
      let nicknameMatches = item.match(/(.*)"(.*)"(.*)/);
      if (nicknameMatches) {
        nicknameMatches = _.map(nicknameMatches, _.trim);
        nicknames.push(nicknameMatches[2]);
        item = `${nicknameMatches[1]} ${nicknameMatches[3]}`;
      }

      return item;
    });

    let finalList = _.uniq(_.concat(trimmedData, nicknames));

    return finalList;
  },
  /**
   * Given a string or array of elements, will remove any unwanted elements
   * @function rejectBadItemsInList
   * @param  {String|Array} data String or Array to filter
   * @return {Array} Filtered array
   **/
  rejectBadItemsInList(data) {
    let SEPARATOR_BLACKLIST = [
      '<br>',
      '<br/>',
      '<br />',
      'and',
      '*',
      '?',
      '&',
      ')',
      '"',
      "'s",
      'The',
      'Related topics',
      'None',
      'numerous others'
    ];
    return _.reject(data, (item) => {
      let length = item.length;
      // Entries too short
      if (length <= 1) {
        return true;
      }
      // Cut in the middle of something
      if (
        _.endsWith(item, ' the') ||
        /^granting/i.test(item)
      ) {
        return true;
      }
      // Contains a buggy Plain list
      if (item.match(/Plain ?list/)) {
        return true;
      }
      // "Adapted by:"
      if (_.endsWith(item, ':')) {
        return true;
      }
      // "-sense"
      if (_.startsWith(item, '-')) {
        return true;
      }
      // Only contains a separator
      if (_.includes(SEPARATOR_BLACKLIST, item)) {
        return true;
      }
      // Looks like a comment
      if (_.startsWith(item, '<!--') || _.endsWith(item, '-->')) {
        return true;
      }

      let hasOpeningParenthesis = _.includes(item, '(');
      let hasClosingParenthesis = _.includes(item, ')');
      if (
        (hasOpeningParenthesis && !hasClosingParenthesis) ||
        (!hasOpeningParenthesis && hasClosingParenthesis)
      ) {
        return true;
      }
      // Enclosed in parenthesis
      if (_.startsWith(item, '(') && _.endsWith(item, ')')) {
        return true;
      }
      return false;
    });
  }
};

export default Helper;
