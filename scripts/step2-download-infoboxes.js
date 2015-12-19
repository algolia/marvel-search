// Pull all data from the Wikipedia and stores it locally as JSON files
import URL from 'url';
import Path from 'path';
import infobox from 'wiki-infobox';
import forEach from 'lodash/collection/forEach';
import glob from 'glob';
import jsonfile from 'jsonfile';

// STEP 2: Downloading all the infoboxes
const downloadUrlPath = './download/urls/';
const downloadInfoboxPath = './download/infoboxes/';
glob(`${downloadUrlPath}/*.json`, (errGlob, files) => {
  if (errGlob) {
    console.info('Error in globbing', errGlob);
    return;
  }

  forEach(files, (file) => {
    console.info(`Reading file ${file}`);
    const characterList = jsonfile.readFileSync(file);

    forEach(characterList, (character) => {
      // Cleanup the name
      let name = character.title;
      name = name.replace('(comics)', '');
      name = name.replace('(Marvel Comics)', '');
      name = name.trim();

      // Getting the name as it is in the url
      let urlName = Path.basename(URL.parse(character.url).pathname);

      // Where to save the final data
      const filepath = `${downloadInfoboxPath}${urlName}.json`;

      console.info(`Getting infobox for ${name}`);
      infobox(urlName, 'en', (errInfobox, data) => {
        if (errInfobox) {
          console.info(`Error when getting the infobox for ${name}`, errInfobox);
          return;
        }

        jsonfile.writeFile(filepath, data, {spaces: 2}, (errWriteFile) => {
          if (errWriteFile) {
            console.info('Error when saving file', errWriteFile);
            return;
          }
          console.info(`Saving ${name} to disk`);
        });
      });
    });
});
});
