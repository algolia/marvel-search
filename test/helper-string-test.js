/* eslint-env mocha */
import expect from 'expect';
import Helper from '../lib/utils/helper-string.js';

describe('HelperString', () => {
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

    it('can accept arrays as input', () => {
      // Given
      let input = [
        'foo',
        'bar/baz',
        'magic'
      ];

      // When
      let actual = Helper.multiSplit(input, '/');

      // Then
      expect(actual).toEqual(['foo', 'bar', 'baz', 'magic']);
    });

    it('should remove empty values', () => {
      // Given
      let input = [
        '/foo',
        'bar/',
        '/baz/'
      ];

      // When
      let actual = Helper.multiSplit(input, '/');

      // Then
      expect(actual).toEqual(['foo', 'bar', 'baz']);
    });

    it('can accept numbers as input', () => {
      // Given
      let input = [
        'foo',
        8,
        'bar/baz',
        'magic'
      ];

      // When
      let actual = Helper.multiSplit(input, '/');

      // Then
      expect(actual).toEqual(['foo', '8', 'bar', 'baz', 'magic']);
    });

    it('returns an empty array for empty input', () => {
      // Given
      let input = null;

      // When
      let actual = Helper.multiSplit(input, '/');

      // Then
      expect(actual).toEqual([]);
    });
  });

  describe('endsWithAnyOf', () => {
    it('should return true if ends with one of the elements', () => {
      // Given
      let string = 'Foo bar baz';
      let list = ['baz'];

      // When
      let actual = Helper.endsWithAnyOf(string, list);

      // Then
      expect(actual).toEqual(true);
    });

    it('should return false if ends with none of the elements', () => {
      // Given
      let string = 'Foo bar baz';
      let list = ['fizzbuzz'];

      // When
      let actual = Helper.endsWithAnyOf(string, list);

      // Then
      expect(actual).toEqual(false);
    });
  });

  describe('firstSentence', () => {
    it('should split on common sentences', () => {
      // Given
      let input = 'Foo. Bar. Baz';

      // When
      let actual = Helper.firstSentence(input);

      // Then
      expect(actual).toEqual('Foo.');
    });

    it('should not be confused by acronyms', () => {
      // Given
      let input = 'Nick Fury is head of the S.H.I.E.L.D. organization. He is busy.';

      // When
      let actual = Helper.firstSentence(input);

      // Then
      expect(actual).toEqual('Nick Fury is head of the S.H.I.E.L.D. organization.');
    });

    it('should work with titles', () => {
      // Given
      let input = 'Mr. Professor X., Ph.D., aka. Professor Xavier. He is famous.';

      // When
      let actual = Helper.firstSentence(input);

      // Then
      expect(actual).toEqual('Mr. Professor X., Ph.D., aka. Professor Xavier.');
    });

    it('should work with Dr.', () => {
      // Given
      let input = 'He is Dr. Watson. Not Sherlock Holmes';

      // When
      let actual = Helper.firstSentence(input);

      // Then
      expect(actual).toEqual('He is Dr. Watson.');
    });

    it('should work with Inc.', () => {
      // Given
      let input = 'Part of A.C.M.E Inc. Corp. Quite big';

      // When
      let actual = Helper.firstSentence(input);

      // Then
      expect(actual).toEqual('Part of A.C.M.E Inc. Corp.');
    });

    it('should work with St.', () => {
      // Given
      let input = 'Monet St. Croix was born in Sarajevo. She is an X-Man.';

      // When
      let actual = Helper.firstSentence(input);

      // Then
      expect(actual).toEqual('Monet St. Croix was born in Sarajevo.');
    });

    it('should work with P.', () => {
      // Given
      let input = 'Pretty Persuasions (Heidi P. Franklin) is a fictional character. For real.';

      // When
      let actual = Helper.firstSentence(input);

      // Then
      expect(actual).toEqual('Pretty Persuasions (Heidi P. Franklin) is a fictional character.');
    });

    it('should return null if no input', () => {
      // Given
      let input = null;

      // When
      let actual = Helper.firstSentence(input);

      // Then
      expect(actual).toEqual(null);
    });
  });

  describe('cleanUpList', () => {
    it('should handle Black Widow', () => {
      // Given
      let input = [
        "* '''via gauntlets:''' ** grappling hook ** taser"
      ];

      // When
      let actual = Helper.cleanUpList(input);

      // Then
      expect(actual).toEqual(['grappling hook', 'taser']);
    });
  });

  describe('splitOnCommonSeparators', () => {
    it('should split on <br>', () => {
      // Given
      let input = [
        '<br>Foo<BR>',
        '<br/>Bar<br />',
        'Baz'
      ];

      // When
      let actual = Helper.splitOnCommonSeparators(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should split on bullet points', () => {
      // Given
      let input = [
        '*Foo*Bar',
        'Baz'
      ];

      // When
      let actual = Helper.splitOnCommonSeparators(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should split on new lines', () => {
      // Given
      let input = [
        '\nFoo\nBar',
        '\nBaz\n'
      ];

      // When
      let actual = Helper.splitOnCommonSeparators(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });
  });

  describe('splitOnCommas', () => {
    it('should split on commas', () => {
      // Given
      let input = 'Foo, Bar, Baz';

      // When
      let actual = Helper.splitOnCommas(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should keep the Jr. and Sr.', () => {
      // Given
      let input = 'John Romita, Jr., John Romita, Sr., Baz';

      // When
      let actual = Helper.splitOnCommas(input);

      // Then
      expect(actual).toEqual(['John Romita, Jr.', 'John Romita, Sr.', 'Baz']);
    });

    it('should split on "and" word', () => {
      // Given
      let input = [
        'Foo and Bar',
        'and Baz and'
      ];

      // When
      let actual = Helper.splitOnCommas(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });
  });

  describe('trimItemsInList', () => {
    it('should remove commas and bullet points', () => {
      // Given
      let input = [
        'Foo,',
        '*Bar',
        '*Baz,'
      ];

      // When
      let actual = Helper.trimItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove {curly braces}', () => {
      // Given
      let input = [
        '{{Foo',
        'Bar}}',
        '{{Baz}}'
      ];

      // When
      let actual = Helper.trimItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove [[# parts', () => {
      // Given
      let input = [
        '[[#Foo',
        'Bar',
        'Baz'
      ];

      // When
      let actual = Helper.trimItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove unclosed "<ref name"', () => {
      // Given
      let input = [
        'Foo',
        'Bar <ref name',
        'Baz'
      ];

      // When
      let actual = Helper.trimItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove unclosed "<ref>"', () => {
      // Given
      let input = [
        'Foo',
        'Bar <ref>{{cite book|last',
        'Baz'
      ];

      // When
      let actual = Helper.trimItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove triple quotes', () => {
      // Given
      let input = [
        "'''Foo",
        "Bar'''",
        "'''Baz'''"
      ];

      // When
      let actual = Helper.trimItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove list dashes', () => {
      // Given
      let input = [
        '- Foo',
        '- Bar',
        '- Baz'
      ];

      // When
      let actual = Helper.trimItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should trim whitespace', () => {
      // Given
      let input = [
        ' Foo',
        'Bar  ',
        ' Baz      '
      ];

      // When
      let actual = Helper.trimItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove any <ref>blahblah</ref>', () => {
      // Given
      let input = [
        'Foo<ref>nope</ref>',
        '<ref>Still nope</ref>Bar',
        '<ref>Nopenopenope</ref>Baz<ref>Huzzah</ref>'
      ];

      // When
      let actual = Helper.trimItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should trim double quotes', () => {
      // Given
      let input = [
        '"Foo',
        'Bar"',
        '"Baz"'
      ];

      // When
      let actual = Helper.trimItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should replace + sign with space', () => {
      // Given
      let input = [
        'Foo+Bar',
        'Baz'
      ];

      // When
      let actual = Helper.trimItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo Bar', 'Baz']);
    });

    it('should trim slashes', () => {
      // Given
      let input = [
        '/Foo',
        'Bar/',
        '/Baz/'
      ];

      // When
      let actual = Helper.trimItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should extract nicknames in their own entry', () => {
      // Given
      let input = [
        'Foo "Bar" Baz',
        'Foo "Bar" Baz'
      ];

      // When
      let actual = Helper.trimItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo Baz', 'Bar']);
    });

    it('should handle complex Cloack and Dagger case', () => {
      // Given
      let input = [
        "'''Cloak''': Tyrone \"Ty\" Johnson",
        "'''Dagger''': Tandy Bowen"
      ];

      // When
      let actual = Helper.trimItemsInList(input);

      // Then
      expect(actual).toEqual(['Tyrone Johnson', 'Tandy Bowen', 'Ty']);
    });

    it('should trim dots', () => {
      // Given
      let input = [
        'Foo.',
        '.Bar',
        '.Baz.'
      ];

      // When
      let actual = Helper.trimItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });
  });

  describe('rejectBadItemsInList', () => {
    it('should remove new lines', () => {
      // Given
      let input = [
        '<br>',
        'Foo',
        '<br/>',
        'Bar',
        '<br />',
        'Baz'
      ];

      // When
      let actual = Helper.rejectBadItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove common separators', () => {
      // Given
      let input = [
        '*',
        'Foo',
        '&',
        '?',
        'Bar',
        ')',
        '"',
        'The',
        'and',
        'Baz'
      ];

      // When
      let actual = Helper.rejectBadItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove Plain list markers', () => {
      // Given
      let input = [
        'Plain list |*',
        'Foo',
        'Plainlist|',
        'Bar',
        'Baz'
      ];

      // When
      let actual = Helper.rejectBadItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove entries with only one letter', () => {
      // Given
      let input = [
        'a',
        'Foo',
        '"',
        'Bar',
        '0',
        'Baz'
      ];

      // When
      let actual = Helper.rejectBadItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove entries with only "\'s"', () => {
      // Given
      let input = [
        "'s",
        'Foo',
        "'s",
        'Bar',
        "'s",
        'Baz'
      ];

      // When
      let actual = Helper.rejectBadItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove "Formerly:" types', () => {
      // Given
      let input = [
        'Formerly:',
        'Foo',
        'In armor:',
        'Bar',
        'Before 1998:',
        'Baz'
      ];

      // When
      let actual = Helper.rejectBadItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove words cut in the middle', () => {
      // Given
      let input = [
        'Foo',
        '-sense',
        'Bar',
        'Baz'
      ];

      // When
      let actual = Helper.rejectBadItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should removes comments', () => {
      // Given
      let input = [
        '<!-- Foo',
        'Bar -->',
        '<!-- Baz -->'
      ];

      // When
      let actual = Helper.rejectBadItemsInList(input);

      // Then
      expect(actual).toEqual([]);
    });

    it('should remove "Related topics"', () => {
      // Given
      let input = [
        'Foo',
        'Related topics',
        'Bar',
        'Baz'
      ];

      // When
      let actual = Helper.rejectBadItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove "None" values', () => {
      // Given
      let input = [
        'Foo',
        'None',
        'Bar',
        'Baz'
      ];

      // When
      let actual = Helper.rejectBadItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove "Numerous others" values', () => {
      // Given
      let input = [
        'Foo',
        'numerous others',
        'Bar',
        'Baz'
      ];

      // When
      let actual = Helper.rejectBadItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove lines ending with "the"', () => {
      // Given
      let input = [
        'Control the',
        'Foo',
        'Helps with the',
        'Bar',
        'Master of the',
        'Baz'
      ];

      // When
      let actual = Helper.rejectBadItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should remove lines starting with "Granting"', () => {
      // Given
      let input = [
        'Granting him strength',
        'Foo',
        'granting her control of elements',
        'Bar',
        'Baz'
      ];

      // When
      let actual = Helper.rejectBadItemsInList(input);

      // Then
      expect(actual).toEqual(['Foo', 'Bar', 'Baz']);
    });

    it('should removes values in parenthesis', () => {
      // Given
      let input = [
        '(Foo)',
        '(Bar)',
        '(Baz)'
      ];

      // When
      let actual = Helper.rejectBadItemsInList(input);

      // Then
      expect(actual).toEqual([]);
    });
  });
});
