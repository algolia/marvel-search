import xray from 'x-ray';
import forEach from 'lodash/collection/forEach';
let x = xray();

const heroes = [
  'https://en.wikipedia.org/wiki/Category:Marvel_Comics_superheroes',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_superheroes&pagefrom=Dazzler',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_superheroes&pagefrom=Jameson%0AJohn+Jameson+%28comics%29',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_superheroes&pagefrom=Prime+%28Comics%29%0APrime+%28comics%29',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_superheroes&pagefrom=Talon+%28Marvel+Comics%29'
];
const villains = [
  'https://en.wikipedia.org/wiki/Category:Marvel_Comics_supervillains',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_supervillains&pagefrom=Chance+%28Comics%29%0AChance+%28comics%29',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_supervillains&pagefrom=Giganto',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_supervillains&pagefrom=Locust+%28comics%29',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_supervillains&pagefrom=Paris+%28Marvel+Comics%29',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_supervillains&pagefrom=Sidewinder+%28comics%29',
  'https://en.wikipedia.org/w/index.php?title=Category:Marvel_Comics_supervillains&pagefrom=Veil+%28comics%29'
];

// STEP 1: Getting the list of all links for all Heroes and Villains
const urlsPath = './download/step1-urls/';
const saveUrlList = (url, name) => {
  const context = '#mw-pages .mw-category-group li';
  const selectors = ['a@href'];

  x(url, context, selectors).write(name);
};

forEach(heroes, (url, index) => {
  const filepath = `${urlsPath}/heroes_${index}.json`;
  console.info(`Saving list of heroes to ${filepath}`);
  saveUrlList(url, filepath);
});
forEach(villains, (url, index) => {
  const filepath = `${urlsPath}/villains_${index}.json`;
  console.info(`Saving list of villains to ${filepath}`);
  saveUrlList(url, filepath);
});
