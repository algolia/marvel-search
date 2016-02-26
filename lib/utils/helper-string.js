import _ from 'lodash';
// import blast from 'blast-text';

const Helper = {
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

  firstSentence(input) {
    if (!input) {
      return null;
    }

    let knownTitles = [
      'Mr.', 'Mrs.', 'Ph.D.', 'e.g.', 'aka.', 'Dr.', 'Inc.', 'St.',
      'P.'
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
  }
};

export default Helper;
