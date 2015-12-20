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
    return this.getListOfValues(data.creators);
  },

  // Avengers, Fantastic Four
  getTeams(data) {
    return this.getListOfValues(data.alliances);
  },

  // Spidey
  getAliases(data) {
    return this.getListOfValues(data.aliases);
  },
  
  // Mutant, Alien
  getSpecies(data) {
    return this.getListOfValues(data.species);
  },
  
  // Rhino, Vulture
  getPartners(data) {
    return this.getListOfValues(data.partners);
  },
  
  // Flying, Telekinesis
  getPowers(data) {
    return this.getListOfValues(data.powers);
  },

  cleanUp(text) {
    text = text.replace(/'''/g, '');
    text = text.replace(/<ref>(.*)<\/ref>/g, '');
    text = text.replace(/^\//, '');

    // Manual cleanup
    // text = text.replace('<ref name', '');
    return text;
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

  getListOfValues(data) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    let results = [];

    // We get the list of all links
    let linkList = _.compact(_.map(data, this.getValueFromLink, this));

    // We get the list of all text nodes (except empty nodes)
    let textList = _.compact(_.map(data, this.getValueFromText, this));

    // Re-split on commas and new lines
    let splittedTextList = [];
    textList.forEach((text) => {
      text.split(', ').forEach((commaSplittedText) => {
        splittedTextList = splittedTextList.concat(commaSplittedText.split('<br>'));
      });
    });

    results = linkList.concat(splittedTextList);

    // Reject empty values
    results = _.reject(results, (result) => {
      let blacklist = [
        '<br>',
        '<br/>',
        ''
      ];

      return _.contains(blacklist, result);
    });

    return results;
  },
};


// TODO:
// isVillain
// See if getValuesFromList is better when only parsing per newline/comma, and
// using links as text?

export default Cleaner;
