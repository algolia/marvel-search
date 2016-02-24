/* eslint-env mocha */
import sinon from 'sinon';
import expect from 'expect';
import Helper from '../lib/utils/helper-infobox.js';

describe('HelperDBPedia', () => {
  afterEach(() => {
    cleanUpStubs(Helper);
  });

  describe('simplifyRaw', () => {
    it('should replace objects with their text value', () => {
      // Given
      let input = {
        aliases: {
          type: 'text',
          value: 'Skybreaker'
        }
      };

      // When
      let actual = Helper.simplifyRaw(input);

      // Then
      expect(actual.aliases).toEqual('Skybreaker');
    });

    it('should replace objects with their link text', () => {
      // Given
      let input = {
        aliases: {
          type: 'link',
          text: 'Skybreaker'
        }
      };

      // When
      let actual = Helper.simplifyRaw(input);

      // Then
      expect(actual.aliases).toEqual('Skybreaker');
    });

    it('should trim values', () => {
      // Given
      let input = {
        aliases: {
          type: 'text',
          value: ' '
        }
      };

      // When
      let actual = Helper.simplifyRaw(input);

      // Then
      expect(actual.aliases).toEqual('');
    });

    it('should work recursively on arrays', () => {
      // Given
      let input = {
        creators: [{
          type: 'text',
          value: 'Stan Lee'
        }, {
          type: 'text',
          value: 'Jack Kirby'
        }]
      };

      // When
      let actual = Helper.simplifyRaw(input);

      // Then
      expect(actual.creators).toEqual(['Stan Lee', 'Jack Kirby']);
    });
  });

  describe('getRecordData', () => {
    it('should return null if the character record name Skunge', () => {
      // Note: All characters on
      // https://en.wikipedia.org/wiki/List_of_Marvel_Comics_characters:_S will
      // have Skunge data because this is the only infobox on this page. Instead
      // of having Skunge data for several characters, we will simply nullify
      // them
      // Given
      let pageName = 'Sunstreak';
      let input = {};
      sinon.stub(Helper, 'getName').returns('Skunge');

      // When
      let actual = Helper.getRecordData(input, pageName);

      // Then
      expect(actual).toEqual(null);
    });
  });

  describe('getAliases', () => {
    it('should split on commas', () => {
      // Given
      let input = {
        aliases: 'Natalie Rushman, Laura Matthers'
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toEqual(['Natalie Rushman', 'Laura Matthers']);
    });

    it('should trim commas', () => {
      // Given
      let input = {
        aliases: 'Natalie Rushman, Laura Matthers,'
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toEqual(['Natalie Rushman', 'Laura Matthers']);
    });

    it('should trim <br>', () => {
      // Given
      let input = {
        aliases: '<br>Natalie Rushman, Laura Matthers,'
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toEqual(['Natalie Rushman', 'Laura Matthers']);
    });

    it('should work on arrays', () => {
      // Given
      let input = {
        aliases: [
          'Natalie Rushman,',
          'Laura Matthers'
        ]
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toEqual(['Natalie Rushman', 'Laura Matthers']);
    });

    it('should remove HTML comments', () => {
      // Given
      let input = {
        aliases: [
          '<!-- Natalie Rushman',
          'Laura Matthers -->'
        ]
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toEqual([]);
    });
  });

  describe('getAlliances', () => {
    it('should remove <br />', () => {
      // Given
      let input = {
        alliances: [
          '<br/>S.H.I.E.L.D',
          '<br />',
          'Avengers'
        ]
      };

      // When
      let actual = Helper.getAlliances(input);

      // Then
      expect(actual).toEqual(['S.H.I.E.L.D', 'Avengers']);
    });

    it('should remove <br/>', () => {
      // Given
      let input = {
        alliances: [
          'S.H.I.E.L.D',
          '<br />',
          'Avengers'
        ]
      };

      // When
      let actual = Helper.getAlliances(input);

      // Then
      expect(actual).toEqual(['S.H.I.E.L.D', 'Avengers']);
    });

    it('should remove empty values', () => {
      // Given
      let input = {
        alliances: [
          '<br />',
          ''
        ]
      };

      // When
      let actual = Helper.getAlliances(input);

      // Then
      expect(actual).toEqual([]);
    });

    it('should split on <br />', () => {
      // Given
      let input = {
        alliances: [
          'S.H.I.E.L.D<br />',
          'Avengers'
        ]
      };

      // When
      let actual = Helper.getAlliances(input);

      // Then
      expect(actual).toEqual(['S.H.I.E.L.D', 'Avengers']);
    });

    it('should split on <br />', () => {
      // Given
      let input = {
        alliances: [
          'S.H.I.E.L.D<br />',
          'Avengers'
        ]
      };

      // When
      let actual = Helper.getAlliances(input);

      // Then
      expect(actual).toEqual(['S.H.I.E.L.D', 'Avengers']);
    });

    it('should split on <br>', () => {
      // Given
      let input = {
        alliances: [
          'S.H.I.E.L.D<br>',
          'Avengers'
        ]
      };

      // When
      let actual = Helper.getAlliances(input);

      // Then
      expect(actual).toEqual(['S.H.I.E.L.D', 'Avengers']);
    });

    it('should remove HTML comments', () => {
      // Given
      let input = {
        alliances: [
          '<!-- X-Men',
          'Avengers-->'
        ]
      };

      // When
      let actual = Helper.getAlliances(input);

      // Then
      expect(actual).toEqual([]);
    });

    it('should remove }}', () => {
      // Given
      let input = {
        alliances: [
          'X-Men',
          'Avengers',
          '}}'
        ]
      };

      // When
      let actual = Helper.getAlliances(input);

      // Then
      expect(actual).toEqual(['X-Men', 'Avengers']);
    });

    it('should remove values in parenthesis', () => {
      // Given
      let input = {
        alliances: [
          '(original team)',
          'X-Men',
          '(formerly)',
          'Avengers'
        ]
      };

      // When
      let actual = Helper.getAlliances(input);

      // Then
      expect(actual).toEqual(['X-Men', 'Avengers']);
    });

    it('should remove keys with {{Plain list', () => {
      // Given
      let input = {
        alliances: [
          '{{Plain list|*',
          'X-Men',
          'Avengers'
        ]
      };

      // When
      let actual = Helper.getAlliances(input);

      // Then
      expect(actual).toEqual(['X-Men', 'Avengers']);
    });
  });

  describe('getSecretIdentities', () => {
    it('should take real_name', () => {
      // Given
      let input = {
        real_name: 'Peter Parker'
      };

      // When
      let actual = Helper.getSecretIdentities(input);

      // Then
      expect(actual).toContain('Peter Parker');
    });

    it('should take alter_ego', () => {
      // Given
      let input = {
        alter_ego: 'Peter Parker'
      };

      // When
      let actual = Helper.getSecretIdentities(input);

      // Then
      expect(actual).toContain('Peter Parker');
    });

    it('should split on -', () => {
      // Given
      let input = {
        alter_ego: '- Peter Parker'
      };

      // When
      let actual = Helper.getSecretIdentities(input);

      // Then
      expect(actual).toEqual(['Peter Parker']);
    });

    it('should split on <br>', () => {
      // Given
      let input = {
        alter_ego: '- Peter Parker',
        real_name: 'Peter Parker<br>'
      };

      // When
      let actual = Helper.getSecretIdentities(input);

      // Then
      expect(actual).toEqual(['Peter Parker']);
    });
  });

  describe('getAuthors', () => {
    it('should remove <br /> and <br>', () => {
      // Given
      let input = {
        creators: [
          'Stan Lee<br />',
          '<br />',
          '<br>Don Rico'
        ]
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'Don Rico']);
    });

    it('should remove }}', () => {
      // Given
      let input = {
        creators: [
          'Stan Lee',
          'Don Rico',
          '}}'
        ]
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'Don Rico']);
    });

    it('should remove *', () => {
      // Given
      let input = {
        creators: [
          'Stan Lee',
          '* Don Rico'
        ]
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'Don Rico']);
    });

    it('should remove &', () => {
      // Given
      let input = {
        creators: [
          'Stan Lee',
          '&',
          'Don Rico'
        ]
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'Don Rico']);
    });

    it('should remove triple quotes', () => {
      // Given
      let input = {
        creators: [
          "'''Stan Lee'''",
          'Don Rico'
        ]
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'Don Rico']);
    });

    it('should remove values in parenthesis', () => {
      // Given
      let input = {
        creators: [
          'Stan Lee',
          '(Marvel)',
          '(Marvel)<br>',
          "'''(Marvel)'''",
          'Don Rico'
        ]
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'Don Rico']);
    });

    it('should remove unknown authors (?)', () => {
      // Given
      let input = {
        creators: [
          'Stan Lee',
          '?',
          'Don Rico'
        ]
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'Don Rico']);
    });

    it('should remove * keys', () => {
      // Given
      let input = {
        creators: [
          'Stan Lee',
          '*',
          'Don Rico'
        ]
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'Don Rico']);
    });

    it('should remove keys with "Blahblah:"', () => {
      // Given
      let input = {
        creators: [
          'Adapted by:',
          'Stan Lee',
          'Original character by:',
          'Steve Dikto'
        ]
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'Steve Dikto']);
    });

    it('should remove keys with {{Plain list', () => {
      // Given
      let input = {
        creators: [
          '{{Plain list| *',
          'Stan Lee',
          'Steve Dikto'
        ]
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'Steve Dikto']);
    });
  });

  describe('getPartners', () => {
    it('should remove <br />', () => {
      // Given
      let input = {
        partners: [
          'Daredevil',
          '<br />',
          'Hawkeye'
        ]
      };

      // When
      let actual = Helper.getPartners(input);

      // Then
      expect(actual).toEqual(['Daredevil', 'Hawkeye']);
    });

    it('should remove empty partners', () => {
      // Given
      let input = {
        partners: [
          'Daredevil',
          '',
          'Hawkeye'
        ]
      };

      // When
      let actual = Helper.getPartners(input);

      // Then
      expect(actual).toEqual(['Daredevil', 'Hawkeye']);
    });

    it('should remove HTML commented elements', () => {
      // Given
      let input = {
        partners: [
          '<!-- optionnal -->'
        ]
      };

      // When
      let actual = Helper.getPartners(input);

      // Then
      expect(actual).toEqual([]);
    });
  });

  describe('getPowers', () => {
    it('should remove starting *', () => {
      // Given
      let input = {
        powers: [
          '*Expert tactician',
          'Slowed aging'
        ]
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Expert tactician', 'Slowed aging']);
    });

    it('should remove triple quotes', () => {
      // Given
      let input = {
        powers: [
          "'''Expert tactician'''",
          'Slowed aging'
        ]
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Expert tactician', 'Slowed aging']);
    });

    it('should trim commas', () => {
      // Given
      let input = {
        powers: [
          ',Expert tactician',
          'Slowed aging'
        ]
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Expert tactician', 'Slowed aging']);
    });

    it('should trim {{ curly braces }}', () => {
      // Given
      let input = {
        powers: [
          '{{Expert tactician',
          'Slowed aging}}'
        ]
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Expert tactician', 'Slowed aging']);
    });

    it('should trim whitespace', () => {
      // Given
      let input = {
        powers: [
          'Expert tactician  ',
          'Slowed aging'
        ]
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Expert tactician', 'Slowed aging']);
    });

    it('split on commas', () => {
      // Given
      let input = {
        powers: [
          'Expert tactician, Slowed aging'
        ]
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Expert tactician', 'Slowed aging']);
    });

    it('split on *', () => {
      // Given
      let input = {
        powers: [
          'Expert tactician * Slowed aging'
        ]
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Expert tactician', 'Slowed aging']);
    });

    it('split on <br>', () => {
      // Given
      let input = {
        powers: [
          'Expert tactician<br> Slowed aging'
        ]
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Expert tactician', 'Slowed aging']);
    });

    it('split on <BR>', () => {
      // Given
      let input = {
        powers: [
          'Expert tactician<BR> Slowed aging'
        ]
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Expert tactician', 'Slowed aging']);
    });

    it('split on " and "', () => {
      // Given
      let input = {
        powers: [
          'Expert tactician and Slowed aging'
        ]
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Expert tactician', 'Slowed aging']);
    });

    it('should remove keys with only separators', () => {
      // Given
      let input = {
        powers: [
          'Expert tactician',
          ', and',
          'Slowed aging'
        ]
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Expert tactician', 'Slowed aging']);
    });

    it('should remove keys with "Formerly:"', () => {
      // Given
      let input = {
        powers: [
          'Formerly:',
          'Expert tactician',
          'With armor:',
          'Slowed aging'
        ]
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Expert tactician', 'Slowed aging']);
    });


    it('should split on **', () => {
      // Given
      let input = {
        powers: [
          '** grappling hook ** knock out gas'
        ]
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['grappling hook', 'knock out gas']);
    });
  });

  describe('getName', () => {
    it('should take character_name', () => {
      // Given
      let input = {
        character_name: 'Black Widow'
      };

      // When
      let actual = Helper.getName(input);

      // Then
      expect(actual).toEqual('Black Widow');
    });

    it('should fallback to pageName', () => {
      // Given
      let input = {};
      let pageName = 'Black_Widow';

      // When
      let actual = Helper.getName(input, pageName);

      // Then
      expect(actual).toEqual('Black Widow');
    });
  });

  describe('isHero', () => {
    it('should be true if hero set to y', () => {
      // Given
      let input = {
        hero: 'y'
      };

      // When
      let actual = Helper.isHero(input);

      // Then
      expect(actual).toEqual(true);
    });
  });
});
