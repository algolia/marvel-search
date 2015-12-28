/* eslint-env mocha */

import expect from 'expect';
import _ from 'lodash';
import Helper from '../scripts/utils/helper.js';

describe('Helper', () => {
  afterEach(() => {
    // Cleanup stubs by sinon if any
    _.keys(Helper).forEach((method) => {
      if (Helper[method].restore) {
        Helper[method].restore();
      }
    });
  });

  describe('getWikipediaName', () => {
    it('should return the name from the url', () => {
      // Given
      let input = 'http://www.foo.com/Magneto';

      // When
      let actual = Helper.getWikipediaName(input);

      // Then
      expect(actual).toEqual('Magneto');
    });
  });

  describe('getJSONFilepathFromUrl', () => {
    it('should only return basename if no filepath specified', () => {
      // Given
      let input = 'http://www.foo.com/Magneto';

      // When
      let actual = Helper.getJSONFilepathFromUrl(input);

      // Then
      expect(actual).toEqual('Magneto.json');
    });
    it('should prepend the passed filepath if one is given', () => {
      // Given
      let input = 'http://www.foo.com/Magneto';
      let filepath = './foobar/';

      // When
      let actual = Helper.getJSONFilepathFromUrl(input, filepath);

      // Then
      expect(actual).toEqual('./foobar/Magneto.json');
    });
    it('should add a slash if missing from the filepatj', () => {
      // Given
      let input = 'http://www.foo.com/Magneto';
      let filepath = './foobar';

      // When
      let actual = Helper.getJSONFilepathFromUrl(input, filepath);

      // Then
      expect(actual).toEqual('./foobar/Magneto.json');
    });
  });

  describe('multiSplit', () => {
    it('split an array with one separator', () => {
      // Given
      let input = 'foo/bar/baz';

      // When
      let actual = Helper.multiSplit(input, '/');

      // Then
      expect(actual).toEqual(['foo', 'bar', 'baz']);
    });
    it('split an array with two separator', () => {
      // Given
      let input = 'foo/bar|baz/magic';

      // When
      let actual = Helper.multiSplit(input, '/', '|');

      // Then
      expect(actual).toEqual(['foo', 'bar', 'baz', 'magic']);
    });
  });
});
