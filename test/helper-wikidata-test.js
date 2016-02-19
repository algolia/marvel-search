/* eslint-env mocha */
import expect from 'expect';
import Helper from '../lib/utils/helper-wikidata.js';

describe('HelperWikidata', () => {
  describe('isReceivedDataMissing', () => {
    it('should return true if has entities.-1', () => {
      // Given
      let input = {
        entities: {
          '-1': true
        }
      };

      // When
      let actual = Helper.isReceivedDataMissing(input);

      // Then
      expect(actual).toEqual(true);
    });

    it('should return false if does not have entities.-1', () => {
      // Given
      let input = {
        entities: {
          Q1735229: {}
        }
      };

      // When
      let actual = Helper.isReceivedDataMissing(input);

      // Then
      expect(actual).toEqual(false);
    });
  });
});
