/* eslint-env mocha */
import expect from 'expect';
import Helper from '../lib/utils/helper-marvel.js';

describe('HelperMarvel', () => {
  describe('getCounts', () => {
    it('should get the number of comics', () => {
      // Given
      let input = {
        comics: {
          available: 42
        }
      };

      // When
      let actual = Helper.getCounts(input);

      // Then
      expect(actual.comics).toEqual(42);
    });

    it('should get the number of events', () => {
      // Given
      let input = {
        events: {
          available: 42
        }
      };

      // When
      let actual = Helper.getCounts(input);

      // Then
      expect(actual.events).toEqual(42);
    });

    it('should get the number of series', () => {
      // Given
      let input = {
        series: {
          available: 42
        }
      };

      // When
      let actual = Helper.getCounts(input);

      // Then
      expect(actual.series).toEqual(42);
    });

    it('should get the number of stories', () => {
      // Given
      let input = {
        stories: {
          available: 42
        }
      };

      // When
      let actual = Helper.getCounts(input);

      // Then
      expect(actual.stories).toEqual(42);
    });
  });

  describe('getDescription', () => {
    it('should get the description', () => {
      // Given
      let input = {
        description: 'Foo'
      };

      // When
      let actual = Helper.getDescription(input);

      // Then
      expect(actual).toEqual('Foo');
    });

    it('should get null if no description', () => {
      // Given
      let input = {
        description: ' '
      };

      // When
      let actual = Helper.getDescription(input);

      // Then
      expect(actual).toEqual(null);
    });
  });

  describe('getImage', () => {
    it('should return the url with extension', () => {
      // Given
      let input = {
        thumbnail: {
          extension: 'jpg',
          path: 'http://foo.bar/baz'
        }
      };

      // When
      let actual = Helper.getImage(input);

      // Then
      expect(actual).toMatch(/\.jpg$/);
    });

    it('should return the standard_xlarge version', () => {
      // Given
      let input = {
        thumbnail: {
          extension: 'jpg',
          path: 'http://foo.bar/baz'
        }
      };

      // When
      let actual = Helper.getImage(input);

      // Then
      expect(actual).toEqual('http://foo.bar/baz/standard_xlarge.jpg');
    });

    it('should return null if image is not availaible', () => {
      // Given
      let input = {
        thumbnail: {
          extension: 'jpg',
          path: 'http://foo.bar/image_not_available'
        }
      };

      // When
      let actual = Helper.getImage(input);

      // Then
      expect(actual).toEqual(null);
    });
  });

  describe('getUrl', () => {
    it('should return the detail url', () => {
      // Given
      let input = {
        urls: [
          {
            type: 'detail',
            url: 'http://foo.bar/baz'
          },
          {
            type: 'comiclink',
            url: 'http://notfoo.notbar/notbaz'
          }
        ]
      };

      // When
      let actual = Helper.getUrl(input);

      // Then
      expect(actual).toEqual('http://foo.bar/baz');
    });

    it('should remove the utm tracking', () => {
      // Given
      let input = {
        urls: [
          {
            type: 'detail',
            url: 'http://foo.bar/baz?utm_thing=foo&utm_that=bar'
          }
        ]
      };

      // When
      let actual = Helper.getUrl(input);

      // Then
      expect(actual).toEqual('http://foo.bar/baz');
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
  });
});
