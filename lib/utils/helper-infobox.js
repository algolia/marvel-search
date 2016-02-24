import _ from 'lodash';
import Promise from 'bluebird';
import infobox from 'wiki-infobox';
import HelperString from './helper-string.js';
import HelperWikipedia from './helper-wikipedia.js';

const Helper = {
  SEPARATOR_BLACKLIST: [
    '<br>',
    '<br/>',
    '<br />',
    'and',
    '*',
    '?',
    '&'
  ],

  /**
   * Download the JSON representation of an infobox for any given Wikipedia page
   * name
   * @function get
   * @param  {string} pageName Wikipedia page name
   * @return {Promise} Promise fulfilled with the object representing the infobox
   **/
  get(pageName) {
    return Promise.promisify(infobox)(decodeURI(pageName), 'en');
  },

  simplifyRaw(rawData) {
    function objectToString(object) {
      let type = _.get(object, 'type');
      if (type === 'text') {
        return _.trim(_.get(object, 'value', ''));
      }
      if (type === 'link') {
        return _.trim(_.get(object, 'text', ''));
      }
    }

    return _.mapValues(rawData, (value) => {
      if (_.isArray(value)) {
        return _.map(value, objectToString);
      }
      return objectToString(value);
    });
  },
  getRecordData(rawData, pageName = null) {
    let simplifiedData = Helper.simplifyRaw(rawData);
    let name = Helper.getName(simplifiedData, pageName);

    // If we got the name Skunge when it wasn't Skunge as input, the it means we
    // hit https://en.wikipedia.org/wiki/List_of_Marvel_Comics_characters:_S and
    // all characters will have Skunge data. In that case, we just fail
    if (name === 'Skunge' && pageName !== 'Skunge') {
      return null;
    }

    let aliases = Helper.getAliases(simplifiedData);
    let alliances = Helper.getAlliances(simplifiedData);
    let authors = Helper.getAuthors(simplifiedData);
    let isHero = Helper.isHero(simplifiedData);
    let partners = Helper.getPartners(simplifiedData);
    let powers = Helper.getPowers(simplifiedData);
    let secretIdentities = Helper.getSecretIdentities(simplifiedData);

    return {
      aliases,
      alliances,
      authors,
      isHero,
      name,
      partners,
      powers,
      secretIdentities
    };
  },

  getAliases(data) {
    let aliases = _.get(data, 'aliases');
    let splitSeparators = [
      ', ',
      '<br>'
    ];
    aliases = HelperString.multiSplit(aliases, ...splitSeparators);

    // Cleanup each alias
    aliases = _.map(aliases, (alias) => {
      alias = _.trimEnd(alias, ',');
      return alias;
    });

    aliases = _.reject(aliases, (alias) => {
      return _.startsWith(alias, '<!--') || _.endsWith(alias, '-->');
    });

    // Remove empty keys and uniq
    aliases = _.uniq(_.compact(aliases));

    return aliases;
  },

  getAlliances(data) {
    let alliances = _.get(data, 'alliances', []);
    let splitSeparators = [
      '<br />',
      '<br>',
      '<br/>'
    ];
    alliances = HelperString.multiSplit(alliances, ...splitSeparators);

    alliances = _.reject(alliances, (alliance) => {
      // Contains a buggy PLain list
      if (_.startsWith(alliance, '{{Plain list')) {
        return true;
      }
      // Only contains a separator
      if (_.includes(Helper.SEPARATOR_BLACKLIST, alliance)) {
        return true;
      }
      // Looks like a comment
      if (_.startsWith(alliance, '<!--') || _.endsWith(alliance, '-->')) {
        return true;
      }
      // Is in parenthesis
      if (_.startsWith(alliance, '(') && _.endsWith(alliance, ')')) {
        return true;
      }
      return false;
    });

    alliances = _.map(alliances, (alliance) => {
      alliance = _.trim(alliance, '{}');
      return alliance;
    });

    return _.uniq(_.compact(alliances));
  },

  getAuthors(data) {
    let authors = _.get(data, 'creators', []);
    let splitSeparators = [
      '<br>',
      '<br />',
      '<br/>'
    ];
    authors = HelperString.multiSplit(authors, ...splitSeparators);

    authors = _.map(authors, (author) => {
      author = _.trim(author, '{}*');
      author = author.replace(/^'''/, '').replace(/'''$/, '');
      author = _.trim(author);
      return author;
    });

    authors = _.reject(authors, (author) => {
      // Contains a buggy PLain list
      if (_.startsWith(author, 'Plain list')) {
        return true;
      }
      // Author is only one of the known separators
      if (_.includes(Helper.SEPARATOR_BLACKLIST, author)) {
        return true;
      }
      // Is in parenthesis
      if (_.startsWith(author, '(') && _.endsWith(author, ')')) {
        return true;
      }
      // "Adapted by:"
      if (_.endsWith(author, ':')) {
        return true;
      }
      return false;
    });

    return _.uniq(_.compact(authors));
  },

  getPartners(data) {
    let partners = _.get(data, 'partners', []);
    if (!_.isArray(partners)) {
      partners = [partners];
    }

    partners = _.reject(partners, (partner) => {
      if (_.includes(Helper.SEPARATOR_BLACKLIST, partner)) {
        return true;
      }
      if (_.startsWith(partner, '<!--') || _.endsWith(partner, '-->')) {
        return true;
      }
    });

    return _.uniq(_.compact(partners));
  },

  getPowers(data) {
    let powers = _.get(data, 'powers', []);
    let splitSeparators = [
      ', ',
      '<br>',
      '<br/>',
      '<br />',
      '<BR>',
      '*',
      '**',
      ' and '
    ];
    powers = HelperString.multiSplit(powers, ...splitSeparators);

    powers = _.map(powers, (power) => {
      power = _.trim(power, '*,{}');
      power = _.trim(power);
      power = power.replace(/^and$/, '');
      power = power.replace(/^'''/, '').replace(/'''$/, '');
      return power;
    });

    powers = _.reject(powers, (power) => {
      // Remove "Armor grants:", "Formerly:" lines
      if (power.match(/:$/)) {
        return true;
      }
      return false;
    });

    powers = _.uniq(_.compact(powers));

    return powers;
  },

  getName(data, pageName = null) {
    let name = _.get(data, 'character_name');
    if (!name) {
      name = HelperWikipedia.readablePageName(pageName);
    }
    return name;
  },

  getSecretIdentities(data) {
    let secretIdentities = _.compact([
      _.get(data, 'real_name'),
      _.get(data, 'alter_ego')
    ]);
    let splitSeparators = [
      '-',
      '<br>'
    ];
    secretIdentities = HelperString.multiSplit(secretIdentities, ...splitSeparators);

    secretIdentities = _.map(secretIdentities, (secretIdentity) => {
      secretIdentity = _.trim(secretIdentity);
      return secretIdentity;
    });

    secretIdentities = _.uniq(_.compact(secretIdentities));

    return secretIdentities;

  },


  isHero(data) {
    return _.get(data, 'hero') === 'y';
  }



};

export default Helper;
