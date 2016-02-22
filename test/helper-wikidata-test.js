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

  describe('getAliases', () => {
    it('should return empty array if no entities', () => {
      // Given
      let input = {
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toEqual([]);
    });

    it('should return empty array if no aliases', () => {
      // Given
      let input = {
        entities: {
          something: {
          }
        }
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toEqual([]);
    });

    it('should return all the aliases', () => {
      // Given
      let input = {
        entities: {
          something: {
            aliases: {
              en: [{
                value: 'Peter Parker'
              }, {
                value: 'Webhead'
              }]
            }
          }
        }
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toEqual(['Peter Parker', 'Webhead']);
    });

    it('should only return english aliases', () => {
      // Given
      let input = {
        entities: {
          something: {
            aliases: {
              fr: [{
                language: 'fr',
                value: 'Tisseur'
              }],
              en: [{
                language: 'en',
                value: 'Peter Parker'
              }, {
                language: 'en',
                value: 'Webhead'
              }]
            }
          }
        }
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toEqual(['Peter Parker', 'Webhead']);
    });
  });
});
