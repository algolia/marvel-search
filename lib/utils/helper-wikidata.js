import _ from 'lodash';

const Helper = {
  /**
   * Check if the data returned by the API is missing
   * @function isReceivedDataMissing
   * @param  {object} receivedData Original data received
   * @return {Boolean} True if data is missing, false otherwise
   **/
  isReceivedDataMissing(receivedData) {
    return _.has(receivedData, 'entities.-1');
  }
};

export default Helper;
