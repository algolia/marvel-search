/* eslint-env mocha */
import expect from 'expect';
import Helper from '../lib/utils/helper-dbpedia.js';

describe('HelperDBPedia', () => {
  beforeEach(() => {
    Helper.WIKI_PAGE_REDIRECTS_URL = 'REDIRECTS';
    Helper.MARVEL_CHARACTERS_LIST_URL = 'FULL_LIST';
  });

  describe('isReceivedDataMissing', () => {
    it('should return true if no object', () => {
      // Given
      let input = {};

      // When
      let actual = Helper.isReceivedDataMissing(input);

      // Then
      expect(actual).toEqual(true);
    });

    it('should return false if no redirect set', () => {
      // Given
      let input = {
        'http://dbpedia.org/resource/foo': {}
      };

      // When
      let actual = Helper.isReceivedDataMissing(input, 'foo');

      // Then
      expect(actual).toEqual(false);
    });

    it('should return true if redirects to main list', () => {
      // Given
      let input = {
        'http://dbpedia.org/resource/foo': {
          REDIRECTS: [{
            type: 'uri',
            value: 'FULL_LIST'
          }]
        }
      };

      // When
      let actual = Helper.isReceivedDataMissing(input, 'foo');

      // Then
      expect(actual).toEqual(true);
    });

    it('should return true if redirects to any letter in the list', () => {
      // Given
      let input = {
        'http://dbpedia.org/resource/foo': {
          REDIRECTS: [{
            type: 'uri',
            value: 'FULL_LIST:_F'
          }]
        }
      };

      // When
      let actual = Helper.isReceivedDataMissing(input, 'foo');

      // Then
      expect(actual).toEqual(true);
    });
  });
});
