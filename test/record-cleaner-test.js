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

  describe('getListOfValues', () => {
    it('should return an array, even if the data is not an array', () => {
      // Given
      let input = 'text';

      // When
      let actual = Cleaner.getListOfValues(input);

      // Then
      expect(actual).toBeA('array');
    });
    it('should return the list of all links', () => {
      // Given
      let input = [
        {type: 'link', text: 'Stan Lee'},
        {type: 'link', text: 'John Byrne'}
      ];

      // When
      let actual = Cleaner.getListOfValues(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'John Byrne']);
    });
    it('should not return <br> text nodes from list of all links', () => {
      // Given
      let input = [
        {type: 'link', text: 'Stan Lee'},
        {type: 'text', value: '<br>'},
        {type: 'link', text: 'John Byrne'}
      ];

      // When
      let actual = Cleaner.getListOfValues(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'John Byrne']);
    });
    it('should not return <br /> text nodes from list of all links', () => {
      // Given
      let input = [
        {type: 'link', text: 'Stan Lee'},
        {type: 'text', value: '<br/>'},
        {type: 'link', text: 'John Byrne'}
      ];

      // When
      let actual = Cleaner.getListOfValues(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'John Byrne']);
    });
    it('should return the only link if there is only one', () => {
      // Given
      let input = {
        type: 'text',
        value: 'Avengers'
      };

      // When
      let actual = Cleaner.getListOfValues(input);

      // Then
      expect(actual).toEqual(['Avengers']);
    });
    it('should return a mix of text and links', () => {
      // Given
      let input = [
        {type: 'link', text: 'Stan Lee'},
        {type: 'text', value: 'John Byrne'}
      ];

      // When
      let actual = Cleaner.getListOfValues(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'John Byrne']);
    });
    it('should return a list from a comma separated text', () => {
      // Given
      let input = {type: 'text', value: 'Stan Lee, John Byrne'};

      // When
      let actual = Cleaner.getListOfValues(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'John Byrne']);
    });
    it('should return a list from several comma separated text', () => {
      // Given
      let input = [
        {type: 'text', value: 'Stan Lee, John Byrne'},
        {type: 'text', value: 'Carl Burgos, Bred Blevins'}
      ];

      // When
      let actual = Cleaner.getListOfValues(input);

      // Then
      expect(actual).toEqual(['Stan Lee', 'John Byrne', 'Carl Burgos', 'Bred Blevins']);
    });
    it('should return a list from a <br> separated text', () => {
      // Given
      let input = {type: 'text', value: 'Strong<br>Clever'};

      // When
      let actual = Cleaner.getListOfValues(input);

      // Then
      expect(actual).toEqual(['Strong', 'Clever']);
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
