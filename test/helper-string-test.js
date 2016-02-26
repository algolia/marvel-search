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

    it('should remove empty values', () => {
      // Given
      let input = [
        '/foo',
        'bar/',
        '/baz/'
      ];

      // When
      let actual = Helper.multiSplit(input, '/');

      // Then
      expect(actual).toEqual(['foo', 'bar', 'baz']);
    });

    it('can accept numbers as input', () => {
      // Given
      let input = [
        'foo',
        8,
        'bar/baz',
        'magic'
      ];

      // When
      let actual = Helper.multiSplit(input, '/');

      // Then
      expect(actual).toEqual(['foo', '8', 'bar', 'baz', 'magic']);
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

  describe('firstSentence', () => {
    it('should split on common sentences', () => {
      // Given
      let input = 'Foo. Bar. Baz';

      // When
      let actual = Helper.firstSentence(input);

      // Then
      expect(actual).toEqual('Foo.');
    });

    it('should not be confused by acronyms', () => {
      // Given
      let input = 'Nick Fury is head of the S.H.I.E.L.D. organization. He is busy.';

      // When
      let actual = Helper.firstSentence(input);

      // Then
      expect(actual).toEqual('Nick Fury is head of the S.H.I.E.L.D. organization.');
    });

    it('should work with titles', () => {
      // Given
      let input = 'Mr. Professor X., Ph.D., aka. Professor Xavier. He is famous.';

      // When
      let actual = Helper.firstSentence(input);

      // Then
      expect(actual).toEqual('Mr. Professor X., Ph.D., aka. Professor Xavier.');
    });

    it('should work with Dr.', () => {
      // Given
      let input = 'He is Dr. Watson. Not Sherlock Holmes';

      // When
      let actual = Helper.firstSentence(input);

      // Then
      expect(actual).toEqual('He is Dr. Watson.');
    });

    it('should work with Inc.', () => {
      // Given
      let input = 'Part of A.C.M.E Inc. Corp. Quite big';

      // When
      let actual = Helper.firstSentence(input);

      // Then
      expect(actual).toEqual('Part of A.C.M.E Inc. Corp.');
    });

    it('should work with St..', () => {
      // Given
      let input = 'Monet St. Croix was born in Sarajevo. She is an X-Man.';

      // When
      let actual = Helper.firstSentence(input);

      // Then
      expect(actual).toEqual('Monet St. Croix was born in Sarajevo.');
    });

    it('should return null if no input', () => {
      // Given
      let input = null;

      // When
      let actual = Helper.firstSentence(input);

      // Then
      expect(actual).toEqual(null);
    });
  });
});
