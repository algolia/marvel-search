/* eslint-env mocha */
import sinon from 'sinon';
import expect from 'expect';
import Helper from '../lib/utils/helper-dbpedia.js';
import HelperWikipedia from '../lib/utils/helper-wikipedia.js';

describe('HelperDBPedia', () => {
  beforeEach(() => {
    Helper.WIKI_PAGE_REDIRECTS_URL = 'REDIRECTS';
    Helper.MARVEL_CHARACTERS_LIST_URL = 'FULL_LIST';
  });

  afterEach(() => {
    cleanUpStubs(HelperWikipedia);
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

  describe('simplifyRaw', () => {
    it('should return null if no data for the specified page', () => {
      // Given
      let input = {
        'http://dbpedia.org/resource/Foobar': {
        }
      };
      let pageName = 'Magneto';

      // When
      let actual = Helper.simplifyRaw(pageName, input);

      // Then
      expect(actual).toEqual(null);
    });

    it('should extract basic DBPedia data', () => {
      // Given
      let input = {
        'http://dbpedia.org/resource/Foobar': {
          'http://dbpedia.org/category/key': [
            {
              value: 42
            }
          ]
        }
      };
      let pageName = 'Foobar';

      // When
      let actual = Helper.simplifyRaw(pageName, input);

      // Then
      expect(actual).toEqual({
        category: {
          key: 42
        }
      });
    });

    it('should extract multiple data as array', () => {
      // Given
      let input = {
        'http://dbpedia.org/resource/Foobar': {
          'http://dbpedia.org/category/key': [
            {
              value: 42
            },
            {
              value: 43
            }
          ]
        }
      };
      let pageName = 'Foobar';

      // When
      let actual = Helper.simplifyRaw(pageName, input);

      // Then
      expect(actual).toEqual({
        category: {
          key: [42, 43]
        }
      });
    });

    it('should not extract multiple data in deep array', () => {
      // Given
      let input = {
        'http://dbpedia.org/resource/Foobar': {
          'http://dbpedia.org/category/key': [
            {
              value: 42
            },
            {
              value: 43
            },
            {
              value: 44
            }
          ]
        }
      };
      let pageName = 'Foobar';

      // When
      let actual = Helper.simplifyRaw(pageName, input);

      // Then
      expect(actual).toEqual({
        category: {
          key: [42, 43, 44]
        }
      });
    });

    it('should only keep english keys if several languages', () => {
      // Given
      let input = {
        'http://dbpedia.org/resource/Foobar': {
          'http://dbpedia.org/category/key': [
            {
              lang: 'en',
              value: 42
            },
            {
              lang: 'fr',
              value: 43
            }
          ]
        }
      };
      let pageName = 'Foobar';

      // When
      let actual = Helper.simplifyRaw(pageName, input);

      // Then
      expect(actual).toEqual({
        category: {
          key: 42
        }
      });
    });

    it('should only keep dbpedia entries', () => {
      // Given
      let input = {
        'http://dbpedia.org/resource/Foobar': {
          'http://www.w3.org/2000/01/rdf-schema#comment': [
            {
              value: 42
            }
          ]
        }
      };
      let pageName = 'Foobar';

      // When
      let actual = Helper.simplifyRaw(pageName, input);

      // Then
      expect(actual).toEqual({});
    });
  });

  describe('cleanUpUrls', () => {
    it('should replace urls with names in direct keys', () => {
      // Given
      let input = 'http://dbpedia.org/resource/Magneto';

      // When
      let actual = Helper.cleanUpUrls(input);

      // Then
      expect(actual).toEqual('Magneto');
    });

    it('should not touch integers', () => {
      // Given
      let input = 42;

      // When
      let actual = Helper.cleanUpUrls(input);

      // Then
      expect(actual).toEqual(42);
    });

    it('should not touch normal strings', () => {
      // Given
      let input = 'foo';

      // When
      let actual = Helper.cleanUpUrls(input);

      // Then
      expect(actual).toEqual('foo');
    });

    it('should be applied to all elements of an array', () => {
      // Given
      let input = [
        'http://dbpedia.org/resource/Magneto',
        'http://dbpedia.org/resource/Storm'
      ];

      // When
      let actual = Helper.cleanUpUrls(input);

      // Then
      expect(actual).toEqual(['Magneto', 'Storm']);
    });

    it('should be applied to all elements of an hash', () => {
      // Given
      let input = {
        foo: 'http://dbpedia.org/resource/Magneto',
        bar: 'http://dbpedia.org/resource/Storm'
      };

      // When
      let actual = Helper.cleanUpUrls(input);

      // Then
      expect(actual.foo).toEqual('Magneto');
      expect(actual.bar).toEqual('Storm');
    });

    it('should work recursively', () => {
      // Given
      let input = {
        foo: {
          bar: [
            {
              value: 'http://dbpedia.org/resource/Magneto'
            }
          ]
        }
      };

      // When
      let actual = Helper.cleanUpUrls(input);

      // Then
      expect(actual.foo.bar[0].value).toEqual('Magneto');
    });

    it('should use the readable version of the page name', () => {
      // Given
      let input = 'http://dbpedia.org/resource/Magneto';
      sinon.stub(HelperWikipedia, 'readablePageName').returns('Foo');

      // When
      let actual = Helper.cleanUpUrls(input);

      // Then
      expect(HelperWikipedia.readablePageName.calledWith('Magneto')).toBe(true);
      expect(actual).toEqual('Foo');
    });
  });
});
