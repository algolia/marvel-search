import glob from 'glob';
import jsonfile from 'jsonfile';

// We convert all files to cleaner versions
const downloadInfoboxPath = './download/infoboxes/';
let records = [];
glob(`${downloadInfoboxPath}/*.json`, (errGlob, characterFiles) => {
  if (errGlob) {
    console.info('Error in globbing', errGlob);
    return;
  }

  characterFiles.forEach((characterFile) => {
    const characterJSON = jsonfile.readFileSync(characterFile);
    const data = characterJSON.data;

    let record = {
      url: characterJSON.url,
      name: characterJSON.name,
      creators: getCreators(data),
      realName: getRealName(data),
      aliases: getAliases(data),
      species: getSpecies(data),
      powers: getPowers(data),
      alliances: getAlliances(data),
      isVillain: isVillain(data)
    }
    console.info(record);
  });
});


// Returns a value of the specified key only if of the specified type
const getValueFromText = (data) => {
  if (data && data.type === 'text') {
    return cleanUp(data.value);
  }
  return null;
};
const getValueFromLink = (data) => {
  if (data && data.type === 'link') {
    return data.text;
  }
  return null;
};
const getValuesFromLink = (data) => {
  if (!Array.isArray(data)) {
    data = [data];
  }
  let results = [];
  data.forEach((item) => {
    let value = getValueFromLink(item);
    if (value) {
      results.push(value);
    }
  });
  return results;
};
const cleanUp = (text) => {
  text = text.replace(/'''/g, '');
  text = text.replace(/<ref>(.*)<\/ref>/g, '');

  // Manual cleanup
  text = text.replace('<ref name', '');
  return text;
};


// Peter Parker
const getRealName = (data) => {
  let realName = getValueFromText(data.real_name);
  let alterEgo = getValueFromText(data.alter_ego);
  return realName || alterEgo;
};
// John Byrne, Stan Lee
const getCreators = (data) => {
  return getValuesFromLink(data.creators);
};
// Flying, Super-human strenght, etc
const getPowers = (data) => {
  let powers = [];

  powers = powers.concat(getValuesFromLink(data.powers));

  let textPowers = (getValueFromText(data.powers) || '').split('<br>');
  powers = powers.concat(textPowers);

  return powers;
};
// Mutant, Extra-planar
const getSpecies = (data) => {
  return getValuesFromLink(data.species);
};
// true / false
const isVillain = (data) => {
  let villain = getValueFromText(data.villain);
  return villain === 'y';
};
// Spidey
const getAliases = (data) => {
  let aliases = [];

  // Check link aliases
  aliases = aliases.concat(getValuesFromLink(data.aliases));

  // Get textual aliases
  let textAliases = (getValueFromText(data.aliases) || '').split(', ');
  aliases = aliases.concat(textAliases);

  return aliases;
};
// Fantastic Four, Avengers
const getAlliances = (data) => {
  let alliances = [];

  alliances = alliances.concat(getValuesFromLink(data.alliances));

  let textAlliances = (getValueFromText(data.alliances) || '').split(', ');
  alliances = alliances.concat(textAlliances);

  return alliances;
};


// TODO: Extract in one method the check of various elements (aliase, powers,
// alliances). Compact array to remove empty elements
//
// Abner Jenkins: Aliases comprends mix de link et text séparé par des ','
// Idem pour abilities.
//
// Question: besoin de splitter en array ou recherche text normale,





