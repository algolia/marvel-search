/* eslint-env mocha */
import expect from 'expect';
import Helper from '../lib/utils/helper-path.js';

describe('HelperPath', () => {
  describe('sanitizeFilename', () => {
    it('should remove all subdirs', () => {
      // Given
      let input = 'foo/bar';

      // When
      let actual = Helper.sanitizeFilename(input);

      // Then
      expect(actual).toEqual('foobar');
    });

    it('should replace spaces with underscores', () => {
      // Given
      let input = 'foo bar';

      // When
      let actual = Helper.sanitizeFilename(input);

      // Then
      expect(actual).toEqual('foo_bar');
    });

    it('should remove trailing dot', () => {
      // Given
      let input = 'foo.';

      // When
      let actual = Helper.sanitizeFilename(input);

      // Then
      expect(actual).toEqual('foo');
    });
  });
});
