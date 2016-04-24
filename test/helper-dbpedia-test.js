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
    cleanUpStubs(Helper);
    cleanUpStubs(HelperWikipedia);
  });

  describe('isReceivedDataMissing', () => {
    it('should return true if object is empty', () => {
      // Given
      let input = {};

      // When
      let actual = Helper.isReceivedDataMissing(input);

      // Then
      expect(actual).toEqual(true);
    });

    it('should return true if no object', () => {
      // Given
      let input = null;

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

  describe('getAuthors', () => {
    it('should understand "A and B"', () => {
      // Given
      let input = {
        property: {
          creators: 'Tom DeFalco and Bren Anderson'
        }
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Tom DeFalco', 'Bren Anderson']);
    });

    it('should split on new lines', () => {
      // Given
      let input = {
        property: {
          creators: 'Nunzio DeFilippis\nChristina Weir'
        }
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Nunzio DeFilippis', 'Christina Weir']);
    });

    it('should cleanup * for bullets', () => {
      // Given
      let input = {
        property: {
          creators: '*Nunzio DeFilippis\n*Christina Weir'
        }
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Nunzio DeFilippis', 'Christina Weir']);
    });

    it('should trim whitespace', () => {
      // Given
      let input = {
        property: {
          creators: ' Nunzio DeFilippis\n Christina Weir'
        }
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Nunzio DeFilippis', 'Christina Weir']);
    });

    it('should understand ["A and B"]', () => {
      // Given
      let input = {
        property: {
          creators: [
            'Paul Gustavson  and',
            'Tyler Curtis Duncan'
          ]
        }
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Paul Gustavson', 'Tyler Curtis Duncan']);
    });

    it('should split on commas', () => {
      // Given
      let input = {
        property: {
          creators: [
            'Roy Thomas, Gary Friedrich',
            'Mike Ploog'
          ]
        }
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Roy Thomas', 'Gary Friedrich', 'Mike Ploog']);
    });

    it('should trim commas', () => {
      // Given
      let input = {
        property: {
          creators: [
            'Roy Thomas,',
            'Mike Ploog'
          ]
        }
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Roy Thomas', 'Mike Ploog']);
    });

    it('should handle John Romita, Jr.', () => {
      // Given
      let input = {
        property: {
          creators: 'John Romita, Jr.'
        }
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['John Romita, Jr.']);
    });

    it('should handle John Romita, Sr.', () => {
      // Given
      let input = {
        property: {
          creators: 'John Romita, Sr.'
        }
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['John Romita, Sr.']);
    });

    it('should handle John Romita, Sr., even in urls', () => {
      // Given
      let input = {
        property: {
          creators: 'http://dbpedia.org/resource/John_Romita,_Sr.'
        }
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['John Romita, Sr.']);
    });

    it('should remove (writer) from names', () => {
      // Given
      let input = {
        property: {
          creators: 'http://dbpedia.org/resource/John_Francis_Moore_(writer)'
        }
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['John Francis Moore']);
    });

    it('should accept DBPedia urls', () => {
      // Given
      let input = {
        property: {
          creators: 'http://dbpedia.org/resource/Bret_Blevins'
        }
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Bret Blevins']);
    });
  });

  describe('getPowers', () => {
    it('should split on new lines', () => {
      // Given
      let input = {
        property: {
          powers: 'Super strength\nInvulnerability'
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Super strength', 'Invulnerability']);
    });

    it('should split on semi-colon', () => {
      // Given
      let input = {
        property: {
          powers: 'Superhuman strength; stamina;'
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Superhuman strength', 'stamina']);
    });

    it('should remove entries that are too long', () => {
      // Given
      let input = {
        property: {
          powers: [
            'Allows him to slip through the grips of others',
            'Foo',
            'Wears a personal force field which can protect him from most harm',
            'Bar',
            "I'm actually writing a full novel in those entries",
            'Baz'
          ]
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should cleanup * for bullets', () => {
      // Given
      let input = {
        property: {
          powers: '*Super strength\n*Invulnerability'
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Super strength', 'Invulnerability']);
    });

    it('should trim commas', () => {
      // Given
      let input = {
        property: {
          powers: [
            'Super strength,',
            'Invulnerability,'
          ]
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Super strength', 'Invulnerability']);
    });

    it('should trim whitespace', () => {
      // Given
      let input = {
        property: {
          powers: [
            ' Super strength',
            ' Invulnerability'
          ]
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Super strength', 'Invulnerability']);
    });

    it('should accept DBPedia urls', () => {
      // Given
      let input = {
        property: {
          powers: 'http://dbpedia.org/resource/Psychometry'
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Psychometry']);
    });

    it('should remove lines that specify what an armor or uniform grants', () => {
      // Given
      let input = {
        property: {
          powers: [
            'Uniform grants:',
            'Super strength,',
            'Invulnerability,'
          ]
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Super strength', 'Invulnerability']);
    });

    it('should keep an empty array if no powers', () => {
      // Given
      let input = {
        property: {
          powers: [
            'None'
          ]
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual([]);
    });

    it('should split on commas', () => {
      // Note: This one can bring more bad than good, but let's try
      // Given
      let input = {
        property: {
          powers: 'Immortality, Strength, Flight'
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Immortality', 'Strength', 'Flight']);
    });

    it('should split on " and "', () => {
      // Note: This one can bring more bad than good, but let's try
      // Given
      let input = {
        property: {
          powers: 'Superhuman speed, strength and durability'
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Superhuman speed', 'strength', 'durability']);
    });

    it('should remove empty elements', () => {
      // Given
      let input = {
        property: {
          powers: [
            'Speed',
            ''
          ]
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Speed']);
    });

    it('should remove elements only containing a quote', () => {
      // Given
      let input = {
        property: {
          powers: [
            'Speed',
            "'"
          ]
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Speed']);
    });
  });

  describe('getSpecies', () => {
    it('should always return an array', () => {
      // Given
      let input = {
        property: {
          species: 'Mutant'
        }
      };

      // When
      let actual = Helper.getSpecies(input);

      // Then
      expect(actual).toEqual(['Mutant']);
    });

    it('should remove empty values from array', () => {
      // Given
      let input = {
        property: {
          species: undefined
        }
      };

      // When
      let actual = Helper.getSpecies(input);

      // Then
      expect(actual).toEqual([]);
    });

    it('should accept DBPedia urls', () => {
      // Given
      let input = {
        property: {
          species: 'http://dbpedia.org/resource/Mutant'
        }
      };

      // When
      let actual = Helper.getSpecies(input);

      // Then
      expect(actual).toEqual(['Mutant']);
    });

    it('should split on /', () => {
      // Given
      let input = {
        property: {
          species: 'Angel/Asgardian'
        }
      };

      // When
      let actual = Helper.getSpecies(input);

      // Then
      expect(actual).toEqual(['Angel', 'Asgardian']);
    });
  });

  describe('getPartners', () => {
    it('should return an array', () => {
      // Given
      let input = {
        property: {
          partners: 'Blastaar'
        }
      };

      // When
      let actual = Helper.getPartners(input);

      // Then
      expect(actual).toEqual(['Blastaar']);
    });

    it('should accept DBPedia urls', () => {
      // Given
      let input = {
        property: {
          partners: 'http://dbpedia.org/resource/Blastaar'
        }
      };

      // When
      let actual = Helper.getPartners(input);

      // Then
      expect(actual).toEqual(['Blastaar']);
    });

    it('should remove empty values', () => {
      // Given
      let input = {
        property: {
          partners: undefined
        }
      };

      // When
      let actual = Helper.getPartners(input);

      // Then
      expect(actual).toEqual([]);
    });

    it('should split on new lines', () => {
      // Given
      let input = {
        property: {
          partners: 'Mister Sinister\nOzymandias'
        }
      };

      // When
      let actual = Helper.getPartners(input);

      // Then
      expect(actual).toEqual(['Mister Sinister', 'Ozymandias']);
    });

    it('should cleanup * for bullets', () => {
      // Given
      let input = {
        property: {
          partners: '* Mister Sinister\n* Ozymandias'
        }
      };

      // When
      let actual = Helper.getPartners(input);

      // Then
      expect(actual).toEqual(['Mister Sinister', 'Ozymandias']);
    });

  });

  describe('getTeams', () => {
    it('should split on new lines', () => {
      // Given
      let input = {
        property: {
          alliances: 'New X-Men\nX-Men'
        }
      };

      // When
      let actual = Helper.getTeams(input);

      // Then
      expect(actual).toEqual(['New X-Men', 'X-Men']);
    });

    it('should split on commas', () => {
      // Given
      let input = {
        property: {
          alliances: 'New X-Men, X-Men'
        }
      };

      // When
      let actual = Helper.getTeams(input);

      // Then
      expect(actual).toEqual(['New X-Men', 'X-Men']);
    });

    it('should cleanup * for bullets', () => {
      // Given
      let input = {
        property: {
          alliances: '*New X-Men\n*X-Men'
        }
      };

      // When
      let actual = Helper.getTeams(input);

      // Then
      expect(actual).toEqual(['New X-Men', 'X-Men']);
    });

    it('should trim whitespace', () => {
      // Given
      let input = {
        property: {
          alliances: ' New X-Men\n X-Men'
        }
      };

      // When
      let actual = Helper.getTeams(input);

      // Then
      expect(actual).toEqual(['New X-Men', 'X-Men']);
    });

    it('should remove empty elements', () => {
      // Given
      let input = {
        property: {
          alliances: [
            'X-Men',
            ''
          ]
        }
      };

      // When
      let actual = Helper.getTeams(input);

      // Then
      expect(actual).toEqual(['X-Men']);
    });
  });

  describe('getAliases', () => {
    it('should split on commas', () => {
      // Given
      let input = {
        property: {
          aliases: 'Angel, Tempest'
        }
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toEqual(['Angel', 'Tempest']);
    });

    it('should take aliases from search', () => {
      // Given
      let input = {
        property: {
          search: 'Spider-Girl'
        }
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toInclude('Spider-Girl');
    });

    it('should take aliases from sortKey', () => {
      // Given
      let input = {
        property: {
          sortkey: 'Spider-Girl'
        }
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toInclude('Spider-Girl');
    });

    it('should take aliases from title', () => {
      // Given
      let input = {
        property: {
          title: 'Spider-Girl'
        }
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toInclude('Spider-Girl');
    });

    it('should take aliases from characterName', () => {
      // Given
      let input = {
        property: {
          characterName: 'Spider-Girl'
        }
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toInclude('Spider-Girl');
    });

    it('should remove duplicates', () => {
      // Given
      let input = {
        property: {
          aliases: [
            'Spider-Girl'
          ],
          sortkey: 'Spider-Girl',
          title: 'Spider-Girl'
        }
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toEqual(['Spider-Girl']);
    });

    it('should remove bad [[# at the start', () => {
      // Given
      let input = {
        property: {
          aliases: [
            '[[#The Magus'
          ]
        }
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toEqual(['The Magus']);
    });
  });

  describe('isVillain', () => {
    it('should read the property.villain', () => {
      // Given
      let input = {
        property: {
          villain: 'y'
        }
      };

      // When
      let actual = Helper.isVillain(input);

      // Then
      expect(actual).toEqual(true);
    });

    it('should return null if no such entry', () => {
      // Given
      let input = {
        property: {
        }
      };

      // When
      let actual = Helper.isVillain(input);

      // Then
      expect(actual).toEqual(null);
    });
  });

  describe('isHero', () => {
    it('should read the property.hero', () => {
      // Given
      let input = {
        property: {
          hero: 'y'
        }
      };

      // When
      let actual = Helper.isHero(input);

      // Then
      expect(actual).toEqual(true);
    });

    it('should return null if no such entry', () => {
      // Given
      let input = {
        property: {
        }
      };

      // When
      let actual = Helper.isHero(input);

      // Then
      expect(actual).toEqual(null);
    });
  });

  describe('getDescription', () => {
    it('should get it from ontology.abstract', () => {
      // Given
      let input = {
        ontology: {
          abstract: 'Good.'
        }
      };

      // When
      let actual = Helper.getDescription(input);

      // Then
      expect(actual).toEqual('Good.');
    });

    it('should only return the first sentence of the description', () => {
      // Given
      let input = {
        ontology: {
          abstract: 'Good. Blab blah? Blah blah blah'
        }
      };

      // When
      let actual = Helper.getDescription(input);

      // Then
      expect(actual).toEqual('Good.');
    });

    it('should split on real sentences', () => {
      // Given
      let input = {
        ontology: {
          abstract: 'Good, M.D, Ph.D. (aka Good).        He is good.'
        }
      };

      // When
      let actual = Helper.getDescription(input);

      // Then
      expect(actual).toEqual('Good, M.D, Ph.D. (aka Good).');
    });

    it('should return null if no description', () => {
      // Given
      let input = {
        ontology: {
        }
      };

      // When
      let actual = Helper.getDescription(input);

      // Then
      expect(actual).toEqual(null);
    });
  });

  describe('getSecretIdentities', () => {
    it('should take realName', () => {
      // Given
      let input = {
        property: {
          realName: 'Peter Parker'
        }
      };

      // When
      let actual = Helper.getSecretIdentities(input);

      // Then
      expect(actual).toEqual(['Peter Parker']);
    });

    it('should take fullName', () => {
      // Given
      let input = {
        property: {
          fullName: 'Peter Parker'
        }
      };

      // When
      let actual = Helper.getSecretIdentities(input);

      // Then
      expect(actual).toContain('Peter Parker');
    });

    it('should remove starting "- "', () => {
      // Given
      let input = {
        property: {
          realName: '- Kingsley Rice'
        }
      };

      // When
      let actual = Helper.getSecretIdentities(input);

      // Then
      expect(actual).toEqual(['Kingsley Rice']);
    });

    it('should allow for arrays', () => {
      // Given
      let input = {
        property: {
          realName: [
            'Thomas Halloway',
            'Simon Halloway'
          ]
        }
      };

      // When
      let actual = Helper.getSecretIdentities(input);

      // Then
      expect(actual).toEqual(['Thomas Halloway', 'Simon Halloway']);
    });

    it('should trim empty elements from array', () => {
      // Given
      let input = {
        property: {
          realName: [
            ''
          ]
        }
      };

      // When
      let actual = Helper.getSecretIdentities(input);

      // Then
      expect(actual).toEqual([]);
    });

    it('should take identities from alterEgo', () => {
      // Given
      let input = {
        property: {
          alterEgo: 'Peter Parker'
        }
      };

      // When
      let actual = Helper.getSecretIdentities(input);

      // Then
      expect(actual).toInclude('Peter Parker');
    });

    it('should remove duplicates', () => {
      // Given
      let input = {
        property: {
          realName: 'Peter Parker',
          alterEgo: 'Peter Parker',
          fullname: 'Peter Parker'
        }
      };

      // When
      let actual = Helper.getSecretIdentities(input);

      // Then
      expect(actual).toEqual(['Peter Parker']);
    });

    it('should split on commas', () => {
      // Given
      let input = {
        property: {
          realName: 'Foo, Bar, Baz'
        }
      };

      // When
      let actual = Helper.getSecretIdentities(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should split on "and"', () => {
      // Given
      let input = {
        property: {
          realName: 'Foo, Bar and Baz'
        }
      };

      // When
      let actual = Helper.getSecretIdentities(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });
  });
});
