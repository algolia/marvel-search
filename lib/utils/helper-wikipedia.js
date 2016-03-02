import _ from 'lodash';
import URL from 'fast-url-parser';

const Helper = {
  /**
   * Returns the Wikipedia page name from a url. This is the last part of the
   * url
   * @function pageName
   * @param  {string} url Original url
   * @return {string} Page name extracted from the url
   **/
  pageName(url) {
    let pathname = URL.parse(url).pathname;
    return pathname.split('/').pop();
  },
  /**
   * Given a Wikipedia page name, will try to make it as readable as possible
   * Eg.
   * readablePageName('Cassandra_Nova_(Marvel_Comics)')
   *  => 'Cassandra Nova'
   * @function readablePageName
   * @param  {string} pageName Original page name
   * @return {string} Readable form of the page name
   **/
  readablePageName(pageName) {
    if (_.startsWith(pageName, 'List_of')) {
      return null;
    }
    pageName = pageName.replace(/_/g, ' ');
    pageName = pageName.replace(/(.*)\((.*)\)$/, '$1');
    pageName = pageName.trim();
    return pageName;
  }
};

export default Helper;
