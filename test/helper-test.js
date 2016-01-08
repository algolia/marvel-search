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
  });
});
