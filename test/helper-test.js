/* eslint-env mocha */

import expect from 'expect';
import _ from 'lodash';
import Helper from '../scripts/utils/helper.js';

describe('Helper', () => {
  afterEach(() => {
    // Cleanup stubs by sinon if any
    _.keys(Helper).forEach((method) => {
      if (Helper[method].restore) {
        Helper[method].restore();
      }
    });
  });

  describe('getWikipediaName', () => {
    it('should return the name from the url', () => {
      // Given
      let input = 'http://www.foo.com/Magneto';

      // When
      let actual = Helper.getWikipediaName(input);

      // Then
      expect(actual).toEqual('Magneto');
    });
  });

  describe('getJSONFilepathFromUrl', () => {
    it('should only return basename if no filepath specified', () => {
      // Given
      let input = 'http://www.foo.com/Magneto';

      // When
      let actual = Helper.getJSONFilepathFromUrl(input);

      // Then
      expect(actual).toEqual('Magneto.json');
    });
    it('should prepend the passed filepath if one is given', () => {
      // Given
      let input = 'http://www.foo.com/Magneto';
      let filepath = './foobar/';

      // When
      let actual = Helper.getJSONFilepathFromUrl(input, filepath);

      // Then
      expect(actual).toEqual('./foobar/Magneto.json');
    });
    it('should add a slash if missing from the filepatj', () => {
      // Given
      let input = 'http://www.foo.com/Magneto';
      let filepath = './foobar';

      // When
      let actual = Helper.getJSONFilepathFromUrl(input, filepath);

      // Then
      expect(actual).toEqual('./foobar/Magneto.json');
    });
  });

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

  describe('getCharacterNameFromUrl', () => {
    it('should get the basename', () => {
      // Given
      let input = 'http://www.foo.bar/Magneto';

      // When
      let actual = Helper.getCharacterNameFromUrl(input);

      // Then
      expect(actual).toEqual('Magneto');
    });
    it('should remove parenthesis', () => {
      // Given
      let input = 'http://www.foo.bar/Magneto_(Marvel_comics)';

      // When
      let actual = Helper.getCharacterNameFromUrl(input);

      // Then
      expect(actual).toEqual('Magneto');
    });
    it('should replace underscore with space', () => {
      // Given
      let input = 'http://www.foo.bar/Iron_Man';

      // When
      let actual = Helper.getCharacterNameFromUrl(input);

      // Then
      expect(actual).toEqual('Iron Man');
    });
  });

  describe('getMarvelKeyFromName', () => {
    it('should return a lower case name', () => {
      // Given
      let input = 'Magneto';

      // When
      let actual = Helper.getMarvelKeyFromName(input);

      // Then
      expect(actual).toEqual('magneto');
    });
    it('should replace spaces with underscore', () => {
      // Given
      let input = 'Jessica Jones';

      // When
      let actual = Helper.getMarvelKeyFromName(input);

      // Then
      expect(actual).toEqual('jessica_jones');
    });
  });

  describe('getMarvelDataFromRaw', () => {
    it('should contain the basic fields', () => {
      // Given
      let input = {
        name: 'Magneto',
        description: 'Evil guy',
        id: 42
      };

      // When
      let actual = Helper.getMarvelDataFromRaw(input);

      // Then
      expect(actual.name).toEqual('Magneto');
      expect(actual.description).toEqual('Evil guy');
      expect(actual.id).toEqual(42);
    });
    it('should contain the image url', () => {
      // Given
      let input = {
        thumbnail: {
          extension: 'jpg',
          path: 'http://www.marvel.com/path/to/file'
        }
      };

      // When
      let actual = Helper.getMarvelDataFromRaw(input);

      // Then
      expect(actual.image).toEqual('http://www.marvel.com/path/to/file.jpg');
    });
    it('should not contain the image url if not found', () => {
      // Given
      let input = {
        thumbnail: {
          extension: 'jpg',
          path: 'http://i.annihil.us/u/prod/marvel/i/mg/b/40/image_not_available'
        }
      };

      // When
      let actual = Helper.getMarvelDataFromRaw(input);

      // Then
      expect(actual.image).toEqual(null);
    });
    it('should contain the comics, events, series and stories count', () => {
      // Given
      let input = {
        comics: {
          available: 1
        },
        events: {
          available: 2
        },
        series: {
          available: 3
        },
        stories: {
          available: 4
        }
      };

      // When
      let actual = Helper.getMarvelDataFromRaw(input);

      // Then
      expect(actual.counts.comics).toEqual(1);
      expect(actual.counts.events).toEqual(2);
      expect(actual.counts.series).toEqual(3);
      expect(actual.counts.stories).toEqual(4);
    });
    it('should contain the wiki url', () => {
      // Given
      let input = {
        urls: [
          {
            type: 'wiki',
            url: 'http://www.marvel.com/wiki/magneto'
          }
        ]
      };

      // When
      let actual = Helper.getMarvelDataFromRaw(input);

      // Then
      expect(actual.url).toEqual('http://www.marvel.com/wiki/magneto');
    });
    it('should not contain the wiki url if not found', () => {
      // Given
      let input = {
        urls: [
          {
            type: 'detail',
            url: 'http://www.marvel.com/wiki/magneto'
          }
        ]
      };

      // When
      let actual = Helper.getMarvelDataFromRaw(input);

      // Then
      expect(actual.url).toEqual(null);
    });
    it('should remove utm tracking from the urls', () => {
      // Given
      let input = {
        urls: [
          {
            type: 'wiki',
            url: 'http://www.marvel.com/wiki/magneto?utm_campaign=apiRef&utm_source=aabbccddeeff'
          }
        ]
      };

      // When
      let actual = Helper.getMarvelDataFromRaw(input);

      // Then
      expect(actual.url).toEqual('http://www.marvel.com/wiki/magneto');
    });
  });

  describe('removeUTMFromUrl', () => {
    it('should remove utm tags from url', () => {
      // Given
      let input = 'http://www.example.com/?utm_a=42&utm_2=test';

      // When
      let actual = Helper.removeUTMFromUrl(input);

      // Then
      expect(actual).toEqual('http://www.example.com/');
    });
  });

  describe('isMarvelNameEqualToWikiData', () => {
    it('should return false if not found', () => {
      // Given
      let wikiData = {
        name: 'John Doe'
      };
      let marvelName = 'Apocalypse';

      // When
      let actual = Helper.isMarvelNameEqualToWikiData(marvelName, wikiData);

      // Then
      expect(actual).toEqual(false);
    });
    it('should return true if same name', () => {
      // Given
      let wikiData = {
        name: 'Apocalypse'
      };
      let marvelName = 'Apocalypse';

      // When
      let actual = Helper.isMarvelNameEqualToWikiData(marvelName, wikiData);

      // Then
      expect(actual).toEqual(true);
    });
    it('should match even with spaces', () => {
      // Given
      let wikiData = {
        name: 'Absorbing Man'
      };
      let marvelName = 'Absorbing Man';

      // When
      let actual = Helper.isMarvelNameEqualToWikiData(marvelName, wikiData);

      // Then
      expect(actual).toEqual(true);
    });
    it('should not be confused by "The"', () => {
      // Given
      let wikiData = {
        name: 'The Abomination'
      };
      let marvelName = 'Abomination';

      // When
      let actual = Helper.isMarvelNameEqualToWikiData(marvelName, wikiData);

      // Then
      expect(actual).toEqual(true);
    });
    it('should match if same secret identity', () => {
      // Given
      let wikiData = {
        name: 'Abomination',
        realName: 'Emil Blonsky'
      };
      let marvelName = 'Abomination (Emil Blonsky)';

      // When
      let actual = Helper.isMarvelNameEqualToWikiData(marvelName, wikiData);

      // Then
      expect(actual).toEqual(true);
    });
    it('should match if marvelName is wiki url', () => {
      // Given
      let wikiData = {
        name: 'Ant-Man',
        url: 'https://en.wikipedia.org/wiki/Ant-Man_(Scott_Lang)'
      };
      let marvelName = 'Ant-Man (Scott Lang)';

      // When
      let actual = Helper.isMarvelNameEqualToWikiData(marvelName, wikiData);

      // Then
      expect(actual).toEqual(true);
    });
    it('should match when name and aliases are reversed', () => {
      // Given
      let wikiData = {
        name: 'Warren Worthington III',
        aliases: 'Angel'
      };
      let marvelName = 'Angel (Warren Worthington III)';

      // When
      let actual = Helper.isMarvelNameEqualToWikiData(marvelName, wikiData);

      // Then
      expect(actual).toEqual(true);
    });
    it('should match even if multiple aliases', () => {
      // Given
      let wikiData = {
        name: 'Warren Worthington III',
        aliases: 'Angel, Darkangel, Death'
      };
      let marvelName = 'Angel (Warren Worthington III)';

      // When
      let actual = Helper.isMarvelNameEqualToWikiData(marvelName, wikiData);

      // Then
      expect(actual).toEqual(true);
    });
  });
});
