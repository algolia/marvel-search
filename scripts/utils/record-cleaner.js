import Helper from './helper.js';
import _ from 'lodash';

const Cleaner = {
  convert(data) {
    let record = {
      name: this.getCharacterName(data),
      url: this.getUrl(data),
      realName: this.getRealName(data.data),
      creators: this.getCreators(data.data),
      teams: this.getTeams(data.data),
      aliases: this.getAliases(data.data),
      species: this.getSpecies(data.data),
      partners: this.getPartners(data.data),
      powers: this.getPowers(data.data),
      powersText: this.getPowersAsText(data.data),
    //   isVillain: isVillain(data)
    };
    return record;
  },

  // Spider-Man
  getCharacterName(data) {
    // First try to get it from the infobox
    let name = this.getValueFromText(data.data.character_name);
    if (!name) {
      name = data.name;
    }
    return name;
  },

  // http://www.foo.bar/Spider-Man
  getUrl(data) {
    return data.url;
  },

  // Peter Parker
  getRealName(data) {
    let realName = this.getValueFromText(data.real_name);
    let alterEgo = this.getValueFromText(data.alter_ego);
    return realName || alterEgo;
  },

  // Stan Lee, John Byrne
  getCreators(data) {
    return this.getFacettedListOfValues(data.creators);
  },

  // Avengers, Fantastic Four
  getTeams(data) {
    return this.getFacettedListOfValues(data.alliances);
  },

  // Spidey
  getAliases(data) {
    return this.getTextualListOfValues(data.aliases);
  },

  // Mutant, Alien
  getSpecies(data) {
    return this.getFacettedListOfValues(data.species);
  },

  // Rhino, Vulture
  getPartners(data) {
    return this.getFacettedListOfValues(data.partners);
  },

  // Flying, Telekinesis
  getPowers(data) {
    return this.getFacettedListOfValues(data.powers);
  },

  // Longer list of powers, as an array
  getPowersAsText(data) {
    let initialList = data.powers;
    if (!initialList) {
      return [];
    }
    if (!Array.isArray(initialList)) {
      initialList = [initialList];
    }

    // Get a full text list
    let concatenatedList = [];
    initialList.forEach((item) => {
      if (item.type === 'link') {
        concatenatedList.push(item.text);
      }
      if (item.type === 'text') {
        concatenatedList.push(item.value);
      }
    });
    let stringList = concatenatedList.join('');

    // Split it
    let separators = [',', '*', '<br>', '<br />', '<br/>', ';'];
    let results = Helper.multiSplit(stringList, ...separators);
    results = _.compact(_.map(results, Cleaner.cleanUp));

    return results;
  },

  cleanUp(text) {
    text = text.replace(/'''/g, '');
    text = text.replace(/<ref>(.*)<\/ref>/g, '');
    text = text.replace(/^\//, '');
    // Leading whitespace
    text = text.replace(/^\s*/, '');
    // HTML comments
    text = text.replace(/<!--(.*)-->/g, '');
    // Dangling closing }}
    text = text.replace(/}}/g, '');
    // Dangling closing comments
    text = text.replace(/-->/g, '');
    text = text.replace(/<!--/g, '');

    // Manual cleanup
    text = text.replace('<ref name', '');
    // Removing stars that are left after parsing some lists
    text = text.replace(/\*/g, '');

    return text.trim();
  },

  getValueFromText(data) {
    if (data && data.type === 'text') {
      return this.cleanUp(data.value);
    }
    return null;
  },

  getValueFromLink(data) {
    if (data && data.type === 'link') {
      return this.cleanUp(data.text);
    }
    return null;
  },

  // Returns an array of all the values contained in links
  getFacettedListOfValues(data) {
    if (!Array.isArray(data)) {
      data = [data];
    }

    // We get the list of all links
    return _.compact(_.map(data, this.getValueFromLink, this));
  },

  // Returns a long string of all values
  getTextualListOfValues(data) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    let result = [];

    data.forEach((item) => {
      result.push(this.getValueFromLink(item) || this.getValueFromText(item));
    });
    return _.compact(result).join(' ');
  }
};

export default Cleaner;
