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
        marvelApiData: {
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
        marvelApiData: {
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

    it('should merge aliases from wikidata, dbpedia and infoboxes', () => {
      // Given
      let input = {
        wikidataData: {
          aliases: [
            'Foo'
          ]
        },
        dbpediaData: {
          aliases: [
            'Bar'
          ]
        },
        infoboxData: {
          aliases: [
            'Baz'
          ]
        }
      };

      // When
      let actual = Helper.merge(input);

      // Then
      expect(actual.aliases).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should merge authors from infoboxData and dbpedia', () => {
      // Given
      let input = {
        dbpediaData: {
          authors: [
            'Bar'
          ]
        },
        infoboxData: {
          authors: [
            'Baz'
          ]
        }
      };

      // When
      let actual = Helper.merge(input);

      // Then
      expect(actual.authors).toEqual(['Bar', 'Baz']);
    });

    it('should merge teams from infoboxData and wikidataData', () => {
      // Given
      let input = {
        dbpediaData: {
          teams: [
            'Bar'
          ]
        },
        infoboxData: {
          teams: [
            'Baz'
          ]
        }
      };

      // When
      let actual = Helper.merge(input);

      // Then
      expect(actual.teams).toEqual(['Bar', 'Baz']);
    });

    it('should remove empty keys', () => {
      // Given
      let input = {
        wikidataData: {},
        dbpediaData: null,
        infoboxData: {
          teams: [
            'Foo',
            'Bar'
          ]
        }
      };

      // When
      let actual = Helper.merge(input);

      // Then
      expect(actual.teams).toEqual(['Foo', 'Bar']);
    });

    it('should merge species', () => {
      // Given
      let input = {
        dbpediaData: {
          species: [
            'Mutant'
          ]
        },
        infoboxData: {
          species: [
            'Human'
          ]
        }
      };

      // When
      let actual = Helper.merge(input);

      // Then
      expect(actual.species).toEqual(['Mutant', 'Human']);
    });
  });

  describe('getImages', () => {
    it('should take thumbnail image from marvel if exists', () => {
      // Given
      let input = {
        imageData: {
          url: 'bad'
        },
        marvelApiData: {
          image: 'good'
        }
      };

      // When
      let actual = Helper.getImages(input);

      // Then
      expect(actual.thumbnail).toEqual('good');
    });

    it('should fallback to imageData', () => {
      // Given
      let input = {
        imageData: {
          url: 'good'
        }
      };

      // When
      let actual = Helper.getImages(input);

      // Then
      expect(actual.thumbnail).toEqual('good');
    });


    it('should get the banner from marvelWebsite if available', () => {
      // Given
      let input = {
        marvelWebsiteData: {
          featuredImage: 'good'
        }
      };

      // When
      let actual = Helper.getImages(input);

      // Then
      expect(actual.banner).toEqual('good');
    });

    it('should get the background from marvelWebsite if available', () => {
      // Given
      let input = {
        marvelWebsiteData: {
          featuredBackground: 'good'
        }
      };

      // When
      let actual = Helper.getImages(input);

      // Then
      expect(actual.background).toEqual('good');
    });
  });

  describe('getPowers', () => {
    it('should remove duplicate value without case sensitivity', () => {
      // Given
      let input = {
        dbpediaData: {
          powers: [
            'Teleportation'
          ]
        },
        infoboxData: {
          powers: [
            'teleportation'
          ]
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual.length).toEqual(1);
    });

    it('should keep only the most relevant powers', () => {
      // Given
      let input = {
        dbpediaData: {
          powers: [
            'Teleportation',
            'Transform into'
          ]
        },
        infoboxData: {
          powers: [
            'Ability to do stuff'
          ]
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Teleportation']);
    });

    it('should capitalize the powers', () => {
      // Given
      let input = {
        dbpediaData: {
          powers: [
            'Teleportation'
          ]
        },
        infoboxData: {
          powers: [
            'durability'
          ]
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Teleportation', 'Durability']);
    });
  });

  describe('pickDataForCharacter', () => {
    it('should pick the character that has the same name', () => {
      // Given
      let character = {
        dbpediaData: {
          name: 'Thor'
        }
      };
      let marvelCharacters = {
        Thor: 'foo'
      };

      // When
      let actual = Helper.pickDataForCharacter(character, marvelCharacters);

      // Then
      expect(actual).toEqual('foo');
    });

    it('should pick the character that matches one of the aliases', () => {
      // Given
      let character = {
        dbpediaData: {
          aliases: [
            'Beetle'
          ]
        }
      };
      let marvelCharacters = {
        'Beetle (Abner Jenkins)': 'foo'
      };

      // When
      let actual = Helper.pickDataForCharacter(character, marvelCharacters);

      // Then
      expect(actual).toEqual('foo');
    });

    it('should return null if no name and no aliases', () => {
      // Given
      let character = {
        dbpediaData: {
          name: null,
          aliases: []
        }
      };
      let marvelCharacters = {
        Thor: 'foo'
      };

      // When
      let actual = Helper.pickDataForCharacter(character, marvelCharacters);

      // Then
      expect(actual).toEqual(null);
    });
  });

});
