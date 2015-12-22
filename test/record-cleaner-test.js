/* eslint-env mocha */

import expect from 'expect';
import sinon from 'sinon';
import _ from 'lodash';
import Cleaner from '../scripts/utils/record-cleaner.js';

describe('Cleaner', () => {
  afterEach(() => {
    // Cleanup stubs by sinon if any
    _.keys(Cleaner).forEach((method) => {
      if (Cleaner[method].restore) {
        Cleaner[method].restore();
      }
    });
  });

  describe('getValueFromText', () => {
    it('returns null if does not exists', () => {
      // Given
      let input = undefined;

      // When
      let actual = Cleaner.getValueFromText(input);

      // Then
      expect(actual).toEqual(null);
    });
    it('returns null if not of type text', () => {
      // Given
      let input = {
        type: 'link',
        value: 'foo'
      };

      // When
      let actual = Cleaner.getValueFromText(input);

      // Then
      expect(actual).toEqual(null);
    });
    it('returns the value field', () => {
      // Given
      let input = {
        type: 'text',
        value: 'foo'
      };

      // When
      let actual = Cleaner.getValueFromText(input);

      // Then
      expect(actual).toEqual('foo');
    });
    it('cleanup the field before returning it', () => {
      // Given
      let input = {
        type: 'text',
        value: 'foo'
      };
      sinon.spy(Cleaner, 'cleanUp');

      // When
      Cleaner.getValueFromText(input);

      // Then
      expect(Cleaner.cleanUp.calledOnce).toBe(true);
    });
  });

  describe('getValueFromLink', () => {
    it('returns null if does not exists', () => {
      // Given
      let input = undefined;

      // When
      let actual = Cleaner.getValueFromLink(input);

      // Then
      expect(actual).toEqual(null);
    });
    it('returns null if not of type link', () => {
      // Given
      let input = {
        type: 'text',
        text: 'foo'
      };

      // When
      let actual = Cleaner.getValueFromLink(input);

      // Then
      expect(actual).toEqual(null);
    });
    it('returns the value field', () => {
      // Given
      let input = {
        type: 'link',
        text: 'foo'
      };

      // When
      let actual = Cleaner.getValueFromLink(input);

      // Then
      expect(actual).toEqual('foo');
    });
    it('cleanup the field before returning it', () => {
      // Given
      let input = {
        type: 'link',
        text: 'foo'
      };
      sinon.spy(Cleaner, 'cleanUp');

      // When
      Cleaner.getValueFromLink(input);

      // Then
      expect(Cleaner.cleanUp.calledOnce).toBe(true);
    });
  });

  describe('getFacettedListOfValues', () => {
    it('should return an array no matter what', () => {
      // Given
      let input = 'foo';

      // When
      let actual = Cleaner.getFacettedListOfValues(input);

      // Then
      expect(actual).toBeA('array');
    });
    it('should return an array if there is only one element', () => {
      // Given
      let input = {type: 'link', text: 'Avengers'};

      // When
      let actual = Cleaner.getFacettedListOfValues(input);

      // Then
      expect(actual).toEqual(['Avengers']);
    });
    it('should return an array of all the links', () => {
      // Given
      let input = [
        {type: 'link', text: 'Stan Lee'},
        {type: 'text', value: '<br>'},
        {type: 'link', text: 'John Byrne'}
      ];

      // When
      let actual = Cleaner.getFacettedListOfValues(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'John Byrne']);
    });
  });

  describe('getTextualListOfValues', () => {
    it('should return a concatenated string of text', () => {
      // Given
      let input = [
        {type: 'text', value: 'Foo'},
        {type: 'link', text: 'Bar'},
        {type: 'text', value: 'Baz'}
      ];
      // When
      let actual = Cleaner.getTextualListOfValues(input);

      // Then
      expect(actual).toEqual('Foo Bar Baz');
    });
    it('should remove stars from a list', () => {
      // Given
      let input = [
        {type: 'text', value: '*'},
        {type: 'text', value: 'Foo'},
        {type: 'link', text: '*Bar *Baz'},
      ];
      // When
      let actual = Cleaner.getTextualListOfValues(input);


      // Then
      expect(actual).toEqual('Foo Bar Baz');
    });
  });

  describe('getCharacterName', () => {
    it('should get it from character name', () => {
      // Given
      let input = {
        data: {
          character_name: {
            type: 'text',
            value: 'Iron Man'
          }
        }
      };

      // When
      let actual = Cleaner.getCharacterName(input);

      // Then
      expect(actual).toEqual('Iron Man');
    });
    it('should get it from name if no character name', () => {
      // Given
      let input = {
        name: 'War Machine',
        data: {}
      };

      // When
      let actual = Cleaner.getCharacterName(input);

      // Then
      expect(actual).toEqual('War Machine');
    });
  });

  describe('cleanUp', () => {
    it('removes triple quotes', () => {
      // Given
      let input = "'''foo'''";

      // When
      let actual = Cleaner.cleanUp(input);

      // Then
      expect(actual).toEqual('foo');
    });
    it('removes <ref>', () => {
      // Given
      let input = "Eightball<ref>''She-Hulk''</ref>";

      // When
      let actual = Cleaner.cleanUp(input);

      // Then
      expect(actual).toEqual('Eightball');
    });
    it('removes leading slash', () => {
      // Given
      let input = '/Alien';

      // When
      let actual = Cleaner.cleanUp(input);

      // Then
      expect(actual).toEqual('Alien');
    });
    it('removed unclosed <ref name', () => {
      // Given
      let input = 'Max Eisenhardt<ref name';

      // When
      let actual = Cleaner.cleanUp(input);

      // Then
      expect(actual).toEqual('Max Eisenhardt');
    });
    it('removes stars', () => {
      // Given
      let input = '*Magnetism';

      // When
      let actual = Cleaner.cleanUp(input);

      // Then
      expect(actual).toEqual('Magnetism');
    });
    it('removes leading whitespaces', () => {
      // Given
      let input = '  Foo';

      // When
      let actual = Cleaner.cleanUp(input);

      // Then
      expect(actual).toEqual('Foo');
    });
    it('removes HTML comments', () => {
      // Given
      let input = 'Foo<!--Bar-->';

      // When
      let actual = Cleaner.cleanUp(input);

      // Then
      expect(actual).toEqual('Foo');
    });
  });

  describe('getUrl', () => {
    it('should get it from root url', () => {
      // Given
      let input = {
        url: 'http://foo.bar/'
      };

      // When
      let actual = Cleaner.getUrl(input);

      // Then
      expect(actual).toEqual('http://foo.bar/');
    });
  });

  describe('getRealName', () => {
    it('should get it from real_name', () => {
      // Given
      let input = {
        real_name: {
          type: 'text',
          value: 'Peter Parker'
        },
        alter_ego: {
          type: 'text',
          value: 'Tony Stark'
        }
      };

      // When
      let actual = Cleaner.getRealName(input);

      // Then
      expect(actual).toEqual('Peter Parker');
    });
    it('should get it from alter_ego if not found in real_name', () => {
      // Given
      let input = {
        alter_ego: {
          type: 'text',
          value: 'Tony Stark'
        }
      };

      // When
      let actual = Cleaner.getRealName(input);

      // Then
      expect(actual).toEqual('Tony Stark');
    });
  });

  describe('getCreators', () => {
    it('should get the list for 8-ball', () => {
      // Given
      let input = {
        creators: [
          {
            type: 'link',
            text: 'Bob Budiansky',
            url: 'http://en.wikipedia.org/wiki/Bob Budiansky'
          },
          {
            type: 'text',
            value: '<br>'
          },
          {
            type: 'link',
            text: 'Bret Blevins',
            url: 'http://en.wikipedia.org/wiki/Bret Blevins'
          }
        ]
      };

      // When
      let actual = Cleaner.getCreators(input);

      // Then
      expect(actual).toEqual(['Bob Budiansky', 'Bret Blevins']);
    });
  });

  describe('getTeams', () => {
    it('should get the list for Abigail Brand', () => {
      // Given
      let input = {
        alliances: [
          {
            type: 'link',
            text: 'S.W.O.R.D.',
            url: 'http://en.wikipedia.org/wiki/S.W.O.R.D. (comics)'
          },
          {
            type: 'text',
            value: '<br>'
          },
          {
            type: 'link',
            text: 'X-Men',
            url: 'http://en.wikipedia.org/wiki/X-Men'
          }
        ]
      };

      // When
      let actual = Cleaner.getTeams(input);

      // Then
      expect(actual).toEqual(['S.W.O.R.D.', 'X-Men']);
    });
  });


});
