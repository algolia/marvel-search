import _ from 'lodash';

const Cleaner = {
  convert(data) {
    let record = {
      name: this.getCharacterName(data),
      url: this.getUrl(data),
      realName: this.getRealName(data.data),
      creators: this.getCreators(data.data),
    //   realName: getRealName(data),
    //   aliases: getAliases(data),
    //   species: getSpecies(data),
    //   powers: getPowers(data),
    //   alliances: getAlliances(data),
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

  getCreators(data) {
    return this.getListOfValues(data.creators);
  },

  cleanUp(text) {
    text = text.replace(/'''/g, '');
    text = text.replace('<br>', '');
    text = text.replace(/<ref>(.*)<\/ref>/g, '');

    // Manual cleanup
    text = text.replace('<ref name', '');
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

    results = linkList.concat(textList);

    return results;
  },
};

//
// // Peter Parker
// // John Byrne, Stan Lee
// const getCreators = (data) => {
//   return getValuesFromLink(data.creators);
// };
// // Flying, Super-human strenght, etc
// const getPowers = (data) => {
//   let powers = [];
//
//   powers = powers.concat(getValuesFromLink(data.powers));
//
//   let textPowers = (getValueFromText(data.powers) || '').split('<br>');
//   powers = powers.concat(textPowers);
//
//   return powers;
// };
// // Mutant, Extra-planar
// const getSpecies = (data) => {
//   return getValuesFromLink(data.species);
// };
// // true / false
// const isVillain = (data) => {
//   let villain = getValueFromText(data.villain);
//   return villain === 'y';
// };
// // Spidey
// const getAliases = (data) => {
//   let aliases = [];
//
//   // Check link aliases
//   aliases = aliases.concat(getValuesFromLink(data.aliases));
//
//   // Get textual aliases
//   let textAliases = (getValueFromText(data.aliases) || '').split(', ');
//   aliases = aliases.concat(textAliases);
//
//   return aliases;
// };
// // Fantastic Four, Avengers
// const getAlliances = (data) => {
//   let alliances = [];
//
//   alliances = alliances.concat(getValuesFromLink(data.alliances));
//
//   let textAlliances = (getValueFromText(data.alliances) || '').split(', ');
//   alliances = alliances.concat(textAlliances);
//
//   return alliances;
// };
//
//
// // TODO: Extract in one method the check of various elements (aliase, powers,
// // alliances). Compact array to remove empty elements
// //
// // Abner Jenkins: Aliases comprends mix de link et text séparé par des ','
// // Idem pour abilities.
// //
// // Question: besoin de splitter en array ou recherche text normale,
//
//
//
//

export default Cleaner;
