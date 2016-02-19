/* eslint-env mocha */
import expect from 'expect';
import Helper from '../lib/utils/helper-wikipedia.js';

describe('HelperWikipedia', () => {
  describe('pageName', () => {
    it('should return the name from the url', () => {
      // Given
      let input = 'http://www.foo.com/Magneto';

      // When
      let actual = Helper.pageName(input);

      // Then
      expect(actual).toEqual('Magneto');
    });
  });
  describe('readablePageName', () => {
    it('should remove all underscores', () => {
      // Given
      let input = 'Adrienne_Frost';

      // When
      let actual = Helper.readablePageName(input);

      // Then
      expect(actual).toEqual('Adrienne Frost');
    });

    it('should remove any mention of (comics)', () => {
      // Given
      let input = 'Hellfire_Club_(comics)';

      // When
      let actual = Helper.readablePageName(input);

      // Then
      expect(actual).toEqual('Hellfire Club');
    });

    it('should remove any mention of (Marvel_Comics)', () => {
      // Given
      let input = 'Mutant_(Marvel_Comics)';

      // When
      let actual = Helper.readablePageName(input);

      // Then
      expect(actual).toEqual('Mutant');
    });
  });
});
