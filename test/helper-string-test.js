/* eslint-env mocha */
import expect from 'expect';
import Helper from '../lib/utils/helper-string.js';

describe('HelperString', () => {
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

    it('can accept arrays as input', () => {
      // Given
      let input = [
        'foo',
        'bar/baz',
        'magic'
      ];

      // When
      let actual = Helper.multiSplit(input, '/');

      // Then
      expect(actual).toEqual(['foo', 'bar', 'baz', 'magic']);
    });

    it('returns an empty array for empty input', () => {
      // Given
      let input = null;

      // When
      let actual = Helper.multiSplit(input, '/');

      // Then
      expect(actual).toEqual([]);
    });
  });
});
