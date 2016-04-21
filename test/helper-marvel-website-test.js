/* eslint-env mocha */
import expect from 'expect';
import Helper from '../lib/utils/helper-marvel-website.js';

describe('HelperMarvelWebsite', () => {
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
});
