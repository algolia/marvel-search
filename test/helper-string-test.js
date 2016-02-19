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
  });

  describe('splitEnglish', () => {
    it('splits on " and "', () => {
      // Given
      let input = 'Tom and Jerry';

      // When
      let actual = Helper.splitEnglish(input);

      // Then
      expect(actual).toEqual(['Tom', 'Jerry']);
    });

    it('splits on "&"', () => {
      // Given
      let input = 'Laurel & Hardy';

      // When
      let actual = Helper.splitEnglish(input);

      // Then
      expect(actual).toEqual(['Laurel', 'Hardy']);
    });

    it('splits on ", "', () => {
      // Given
      let input = 'Huey, Dewey and Louie';

      // When
      let actual = Helper.splitEnglish(input);

      // Then
      expect(actual).toEqual(['Huey', 'Dewey', 'Louie']);
    });

    it('splits on ","', () => {
      // Given
      let input = 'foo,bar';

      // When
      let actual = Helper.splitEnglish(input);

      // Then
      expect(actual).toEqual(['foo', 'bar']);
    });

    it('removes last dot', () => {
      // Given
      let input = 'Me and you.';

      // When
      let actual = Helper.splitEnglish(input);

      // Then
      expect(actual).toEqual(['Me', 'you']);
    });

    it('handles John Romita Jr', () => {
      // Given
      let input = 'John Romita, Jr';

      // When
      let actual = Helper.splitEnglish(input);

      // Then
      expect(actual).toEqual(['John Romita Jr']);
    });

    it('returns undefined if empty', () => {
      // Given
      let input = '';

      // When
      let actual = Helper.splitEnglish(input);

      // Then
      expect(actual).toEqual(undefined);
    });
  

  });
});
