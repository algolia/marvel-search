import Promise from 'bluebird';
import infobox from 'wiki-infobox';

const Helper = {
  get(pageName) {
    return Promise.promisify(infobox)(pageName, 'en');
  }
};

export default Helper;
