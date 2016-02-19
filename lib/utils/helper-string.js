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
  }
};

export default Helper;

