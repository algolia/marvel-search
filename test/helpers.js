/* eslint-env mocha */
import _ from 'lodash';
global.ddescribe = describe.only;
global.fdescribe = describe.only;
global.xdescribe = describe.skip;
global.iit = it.only;
global.fit = it.only;
global.xit = it.skip;

global.cleanUpStubs = function (object) {
  _.keys(object).forEach((method) => {
    if (object[method].restore) {
      object[method].restore();
    }
  });
};
