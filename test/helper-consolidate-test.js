/* eslint-env mocha */
import expect from 'expect';
import Helper from '../lib/utils/helper-consolidate.js';

describe('HelperConsolidate', () => {
  describe('isSameName', () => {
    it('should match if exactly the same name', () => {
      // Given
      let nameOne = 'Thor';
      let nameTwo = 'Thor';

      // When
      let actual = Helper.isSameName(nameOne, nameTwo);

      // Then
      expect(actual).toEqual(true);
    });

    it('should match if found outside of parenthesis', () => {
      // Given
      let nameOne = 'Beetle';
      let nameTwo = 'Beetle (Abner Jenkins)';

      // When
      let actual = Helper.isSameName(nameOne, nameTwo);

      // Then
      expect(actual).toEqual(true);
    });

    it('should match if found in parenthesis', () => {
      // Given
      let nameOne = 'Adrienne Frost';
      let nameTwo = 'White Queen (Adrienne Frost)';

      // When
      let actual = Helper.isSameName(nameOne, nameTwo);

      // Then
      expect(actual).toEqual(true);
    });

    it('should work by reversing the arguments', () => {
      // Given
      let nameOne = 'Adrienne Frost';
      let nameTwo = 'White Queen (Adrienne Frost)';

      // When
      let actual = Helper.isSameName(nameTwo, nameOne);

      // Then
      expect(actual).toEqual(true);
    });
  });

  describe('merge', () => {
    it('should take description from marvel if exists', () => {
      // Given
      let input = {
        dbpediaData: {
          description: 'bad'
        },
        marvelData: {
          description: 'good'
        }
      };

      // When
      let actual = Helper.merge(input);

      // Then
      expect(actual.description).toEqual('good');
    });

    it('should fallback to dbpedia description', () => {
      // Given
      let input = {
        dbpediaData: {
          description: 'good'
        }
      };

      // When
      let actual = Helper.merge(input);

      // Then
      expect(actual.description).toEqual('good');
    });

    it('should take name from marvel if exists', () => {
      // Given
      let input = {
        dbpediaData: {
          name: 'bad'
        },
        marvelData: {
          name: 'good'
        }
      };

      // When
      let actual = Helper.merge(input);

      // Then
      expect(actual.name).toEqual('good');
    });

    it('should fallback to dbpedia', () => {
      // Given
      let input = {
        dbpediaData: {
          name: 'good'
        }
      };

      // When
      let actual = Helper.merge(input);

      // Then
      expect(actual.name).toEqual('good');
    });

    it('should take image from marvel if exists', () => {
      // Given
      let input = {
        imageData: {
          url: 'bad'
        },
        marvelData: {
          image: 'good'
        }
      };

      // When
      let actual = Helper.merge(input);

      // Then
      expect(actual.image).toEqual('good');
    });

    it('should fallback to imageData', () => {
      // Given
      let input = {
        imageData: {
          url: 'good'
        }
      };

      // When
      let actual = Helper.merge(input);

      // Then
      expect(actual.image).toEqual('good');
    });

    it('should merge aliases from marvelData and wikidataData', () => {
      // Given
      let input = {
        marvelData: {
          aliases: [
            'Foo',
            'Bar'
          ]
        },
        wikidataData: {
          aliases: [
            'Foo',
            'Baz'
          ]
        }
      };

      // When
      let actual = Helper.merge(input);

      // Then
      expect(actual.aliases).toEqual(['Foo', 'Bar', 'Baz']);
    });
  });
});
