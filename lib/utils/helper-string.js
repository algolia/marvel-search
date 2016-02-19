import _ from 'lodash';

const Helper = {
  /**
   * Splits a string into an array, on specified separators
   * multiSplit("Huey, Dewey and Louie", ", ", " and ")
   * ['Huey', 'Dewey', 'Louie']
   * @function multiSplit
   * @param  {string} input Input string to split
   * @param  {...string} separators String separator on which to split the string
   * @return {Array} Array of parts
   **/
  multiSplit(input, ...separators) {
    let results = [input];
    let tmp = [];

    _.each(separators, (separator) => {
      // We split each element in the current results according to the split and
      // we add it to the tmp
      _.each(results, (item) => {
        tmp.push.apply(tmp, item.split(separator));
      });
      results = tmp;
      tmp = [];
    });
    return results;
  },
  /**
   * Splits an english string to an array
   * @function splitEnglish
   * @param  {string} input Input string to split
   * @return {Array} Array of parts
   **/
  splitEnglish(input) {
    if (!input) {
      return undefined;
    }
    input = _.trimEnd(input, '.');

    // 'John_Romita,_Jr'
    input = input.replace(',_Jr', '_Jr');
    input = input.replace(', Jr', ' Jr');

    return Helper.multiSplit(input,
                             ' and ',
                             ', ',
                             ',',
                             ' & '
                            );
  }
};

export default Helper;
