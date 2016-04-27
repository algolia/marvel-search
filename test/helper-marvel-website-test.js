/* eslint-env mocha */
import sinon from 'sinon';
import expect from 'expect';
import Helper from '../lib/utils/helper-marvel-website.js';

describe('HelperMarvelWebsite', () => {
  afterEach(() => {
    cleanUpStubs(Helper);
  });

  describe('getRecordData', () => {
    it('should return null if no color and not thumbnail', () => {
      // Given
      let input = {};
      sinon.stub(Helper, 'getMainColor').returns(null);
      sinon.stub(Helper, 'getThumbnail').returns(null);

      // When
      let actual = Helper.getRecordData(input);

      // Then
      expect(actual).toEqual(null);
    });
  });

  describe('getFeaturedImage', () => {
    it('should grab the url of the image', () => {
      // Given
      let input = `<div class="featuredImage">
                     <img src="foo">
                   </div>`;

      // When
      let actual = Helper.getFeaturedImage(input);

      // Then
      expect(actual).toEqual('foo');
    });

    it('should return null if no featuredImage', () => {
      // Given
      let input = `
      `;

      // When
      let actual = Helper.getFeaturedImage(input);

      // Then
      expect(actual).toEqual(null);
    });
  });

  describe('getThumbnail', () => {
    it('should grab the url of the thumbnail', () => {
      // Given
      let input = `<img class="character-image" src="foo">`;

      // When
      let actual = Helper.getThumbnail(input);

      // Then
      expect(actual).toEqual('foo');
    });

    it('should return null if no thumbnail', () => {
      // Given
      let input = ``;

      // When
      let actual = Helper.getThumbnail(input);

      // Then
      expect(actual).toEqual(null);
    });

    it('should return null if default image', () => {
      // Given
      let input = `<img
          class="character-image"
          src="http://x.annihil.us/u/prod/marvel/i/mg/b/40/image_not_available/standard_xlarge.jpg"
        >`;

      // When
      let actual = Helper.getThumbnail(input);

      // Then
      expect(actual).toEqual(null);
    });
  });

  describe('getFeaturedBackground', () => {
    it('should grab the url of the image in the background', () => {
      // Given
      let input = `
      <div class="featuredImage"></div>
      <style>
        @media (min-width: 700px) {
          .module.featuredCharacter, body .module-detail.featured-bio {
            background-image: url(http://foo.com/);
          }
        }
      </style>
      `;

      // When
      let actual = Helper.getFeaturedBackground(input);

      // Then
      expect(actual).toEqual('http://foo.com/');
    });

    it('should return null if no featuredImage', () => {
      // Given
      let input = `
      <div class="foo"></div>
      `;

      // When
      let actual = Helper.getFeaturedBackground(input);

      // Then
      expect(actual).toEqual(null);
    });

    it('should prefix with marvel.com if not http defined', () => {
      // Given
      let input = `
      <div class="featuredImage"></div>
      <style>
        @media (min-width: 700px) {
          .module.featuredCharacter, body .module-detail.featured-bio {
            background-image: url(/i/foo/bar.jpg);
          }
        }
      </style>
      `;

      // When
      let actual = Helper.getFeaturedBackground(input);

      // Then
      expect(actual).toEqual('//marvel.com/i/foo/bar.jpg');
    });
  });

  describe('getMainColor', () => {
    it('should get the main color', () => {
      // Given
      let input = `
      <script>
      var rgbString = "58,36,9";
      </script>
      `;

      // When
      let actual = Helper.getMainColor(input);

      // Then
      expect(actual.red).toEqual(58);
      expect(actual.green).toEqual(36);
      expect(actual.blue).toEqual(9);
    });

    it('should get the main color as hexa', () => {
      // Given
      let input = `
      <script>
      var rgbString = "58,36,9";
      </script>
      `;

      // When
      let actual = Helper.getMainColor(input);

      // Then
      expect(actual.hexa).toEqual('3A2409');
    });

    it('should return null if none defined', () => {
      // Given
      let input = `
      <script>
      var rgbString = "";
      </script>
      `;

      // When
      let actual = Helper.getMainColor(input);

      // Then
      expect(actual).toEqual(null);
    });
  });

  describe('getName', () => {
    it('should get the character name', () => {
      // Given
      let input = `
      <a class="nameTitle">Wolverine</a>
      `;

      // When
      let actual = Helper.getName(input);

      // Then
      expect(actual).toEqual('Wolverine');
    });
  });

  describe('getUrl', () => {
    it('should get the webpage url', () => {
      // Given
      let input = `
      <head>
        <meta name="twitter:url" content="good" />
      </head
      `;

      // When
      let actual = Helper.getUrl(input);

      // Then
      expect(actual).toEqual('good');
    });
  });

  describe('getDescription', () => {
    it('should get the page description', () => {
      // Given
      let input = `
        <meta name="description" content="good" />
      `;

      // When
      let actual = Helper.getDescription(input);

      // Then
      expect(actual).toEqual('good');
    });

    it('should discard descriptions that are too generic', () => {
      // Given
      let input = `
        <meta name="description" content="Marvel.com is the source for Marvel comics, digital comics, comic strips, and more featuring Iron Man, Spider-Man, Hulk, X-Men and all your favorite superheroes." />
      `;

      // When
      let actual = Helper.getDescription(input);

      // Then
      expect(actual).toEqual(null);
    });
  });
});
