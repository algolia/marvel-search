/* eslint-env mocha */
import sinon from 'sinon';
import expect from 'expect';
import Helper from '../lib/utils/helper-marvel.js';

describe('HelperMarvel', () => {
  afterEach(() => {
    cleanUpStubs(Helper);
  });

  describe('fixBadEncoding', () => {
    it('should only apply on arrays', () => {
      // Given
      let input = [];

      // When
      let actual = Helper.fixBadEncoding(input);

      // Then
      expect(actual).toEqual(input);
    });

    it('should fix bad quotes', () => {
      // Given
      let input = 'Itï¿½s bullshit';

      // When
      let actual = Helper.fixBadEncoding(input);

      // Then
      expect(actual).toEqual("It's bullshit");
    });
  });

  describe('getRecordData', () => {
    it('should return null for characters in the wrong universe', () => {
      // Given
      let input = {};
      sinon.stub(Helper, 'isWrongUniverse').returns(true);

      // When
      let actual = Helper.getRecordData(input);

      // Then
      expect(actual).toEqual(null);
    });

    it('should return null for characters with no description and no image', () => {
      // Given
      let input = {
        name: 'Aaron Stack'
      };
      sinon.stub(Helper, 'getDescription').returns(null);
      sinon.stub(Helper, 'getImage').returns(null);

      // When
      let actual = Helper.getRecordData(input);

      // Then
      expect(actual).toEqual(null);
    });
  });

  describe('isWrongUniverse', () => {
    it('should return null for LEGO characters', () => {
      // Given
      let input = {
        name: 'Hulk (LEGO Marvel Super Heroes)'
      };

      // When
      let actual = Helper.getRecordData(input);

      // Then
      expect(actual).toEqual(null);
    });

    it('should return null for Ultimate characters', () => {
      // Given
      let input = {
        name: 'Stryfe (Ultimate)'
      };

      // When
      let actual = Helper.getRecordData(input);

      // Then
      expect(actual).toEqual(null);
    });

    it('should return null for 2099 characters', () => {
      // Given
      let input = {
        name: 'Punisher (2099)'
      };

      // When
      let actual = Helper.getRecordData(input);

      // Then
      expect(actual).toEqual(null);
    });
  });

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

    it('should fix the fucked up characters returned by the API', () => {
      // Given
      let input = {
        description: 'Itï¿½s bullshit'
      };

      // When
      let actual = Helper.getDescription(input);

      // Then
      expect(actual).toEqual("It's bullshit");
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

    it('should return null instead of /comics/characters links', () => {
      // Given
      let input = {
        urls: [
          {
            type: 'detail',
            url: 'http://marvel.com/comics/characters/1009718/wolverine'
          }
        ]
      };

      // When
      let actual = Helper.getUrl(input);

      // Then
      expect(actual).toEqual(null);
    });
  });
});
