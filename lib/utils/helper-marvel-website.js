import _ from 'lodash';
import cheerio from 'cheerio';
import rgb2hex from 'rgb-hex';

const Helper = {
  /**
   * Given the HTML content of a Marvel page, return interesting data for the
   * record
   * @function getRecordData
   * @param  {string} html Raw HTML form the webpage
   * @return {Object} The curated version of the data
   **/
  getRecordData(html) {
    html = html.toString();
    let thumbnail = Helper.getThumbnail(html);
    let mainColor = Helper.getMainColor(html);

    // No interesting data, better return nothing
    if (!thumbnail && !mainColor) {
      return null;
    }

    let description = Helper.getDescription(html);
    let featuredBackground = Helper.getFeaturedBackground(html);
    let featuredImage = Helper.getFeaturedImage(html);
    let name = Helper.getName(html);
    let url = Helper.getUrl(html);

    let recordData = {
      url,
      description,
      name,
      featuredImage,
      featuredBackground,
      thumbnail,
      mainColor
    };

    return recordData;
  },

  getName(html) {
    let $ = cheerio.load(html);
    return $('a.nameTitle').text();
  },

  getUrl(html) {
    let $ = cheerio.load(html);
    return $('meta[name="twitter:url"]').attr('content');
  },

  getDescription(html) {
    let $ = cheerio.load(html);
    return $('meta[name="description"]').attr('content');
  },

  getFeaturedImage(html) {
    let $ = cheerio.load(html);
    let imgElement = $('.featuredImage img');
    if (imgElement.length === 0) {
      return null;
    }
    return imgElement.attr('src');
  },

  getThumbnail(html) {
    let $ = cheerio.load(html);
    let imgElement = $('.character-image');
    if (imgElement.length === 0) {
      return null;
    }
    let url = imgElement.attr('src');
    if (url.match(/image_not_available/)) {
      return null;
    }

    return url;
  },

  getFeaturedBackground(html) {
    let $ = cheerio.load(html);
    let styleElement = $('.featuredImage').next('style');
    if (styleElement.length === 0) {
      return null;
    }
    let styleLines = _.map(styleElement.html().split('\n'), _.trim);
    let backgroundUrl = '';
    _.each(styleLines, (line) => {
      if (!_.startsWith(line, 'background-image')) {
        return;
      }
      backgroundUrl = line.replace(/(.*)\((.*)\)(.*)/, '$2');
    });

    // Prefix with marvel.com
    if (!_.startsWith(backgroundUrl, 'http')) {
      backgroundUrl = `//marvel.com${backgroundUrl}`;
    }

    return backgroundUrl;
  },

  getMainColor(html) {
    let $ = cheerio.load(html);
    // We get all the scripts content
    let scripts = $('script');
    let lines = [];
    _.each(scripts, (script) => {
      let content = $(script).html();
      if (!content) {
        return;
      }
      lines = _.concat(lines, content.split('\n'));
    });
    lines = _.compact(_.map(lines, _.trim));

    // We find the line defining the `rgbString`
    let matchingLine = _.find(lines, (line) => {
      return _.startsWith(line, 'var rgbString');
    });

    // We parse it
    let rgbString = matchingLine.replace(/(.*)"(.*)"(.*)/, '$2');
    let split = _.map(rgbString.split(','), _.toInteger);
    if (split.length !== 3) {
      return null;
    }
    let red = split[0];
    let green = split[1];
    let blue = split[2];
    let hexa = rgb2hex(red, green, blue).toUpperCase();
    return {
      red, green, blue, hexa
    };
  }
};

export default Helper;
