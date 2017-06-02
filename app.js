(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = ({}).hasOwnProperty;

  var unalias = function(alias, loaderPath) {
    var result = aliases[alias] || aliases[alias + '/index.js'];
    return result || alias;
  };

  var _reg = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (_reg.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = unalias(name, loaderPath);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has.call(cache, dirIndex)) return cache[dirIndex].exports;
    if (has.call(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from ' + '"' + loaderPath + '"');
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  require.list = function() {
    var result = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  require.brunch = true;
  require._cache = cache;
  globals.require = require;
})();
require.register("app", function(exports, require, module) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var Marvel = {
  init: function init() {
    this.search = instantsearch({
      appId: 'O3F8QXYK6R',
      apiKey: '78e45b023b7ff7d8ba88c59c9db19890',
      indexName: 'marvel',
      urlSync: true,
      searchFunction: function searchFunction(helper) {
        // Reset the lazyloadCounter
        Marvel.lazyloadCounter = 0;
        helper.search();
      }
    });

    this.search.on('render', this.onRender);

    this.addSearchBoxWidget();
    this.addStatsWidget();
    this.addTeamsWidget();
    this.addAuthorsWidget();
    this.addPowersWidget();
    this.addSpeciesWidget();
    this.addHitsWidget();
    this.addPaginationWidget();
    this.addRefinementList();

    this.addOpenProfile();

    this.search.start();
  },
  cloudinary: function cloudinary(url, options) {
    var baseUrl = 'https://res.cloudinary.com/pixelastic-marvel/image/fetch/';
    var stringOptions = [];

    // Handle common Cloudinary options
    if (options.width) {
      stringOptions.push('w_' + options.width);
    }
    if (options.height) {
      stringOptions.push('h_' + options.height);
    }
    if (options.quality) {
      stringOptions.push('q_' + options.quality);
    }
    if (options.crop) {
      stringOptions.push('c_' + options.crop);
    }
    if (options.format) {
      stringOptions.push('f_' + options.format);
    }
    if (options.colorize) {
      stringOptions.push('e_colorize:' + options.colorize);
    }
    if (options.color) {
      stringOptions.push('co_rgb:' + options.color);
    }
    if (options.gravity) {
      stringOptions.push('g_' + options.gravity);
    }

    // Fix remote urls
    url = url.replace(/^\/\//, 'http://');

    return '' + baseUrl + stringOptions.join(',') + '/' + url;
  },
  transformItem: function transformItem(data) {
    // Main color
    var mainColorHexa = _.get(data, 'mainColor.hexa');
    var mainColorRgb = null;
    if (mainColorHexa) {
      mainColorRgb = data.mainColor.red + ',' + data.mainColor.green + ',' + data.mainColor.blue;
    }

    // Thumbnail
    var thumbnail = _.get(data, 'images.thumbnail');
    if (thumbnail) {
      thumbnail = Marvel.cloudinary(thumbnail, {
        width: 200,
        quality: 90,
        crop: 'scale',
        format: 'auto'
      });
    } else {
      thumbnail = './img/hit-default.jpg';
    }

    // Background image
    var background = _.get(data, 'images.background');
    if (background) {
      var backgroundOptions = {
        width: 450,
        quality: 90,
        crop: 'scale',
        format: 'auto'
      };
      if (mainColorHexa) {
        backgroundOptions = _extends({}, backgroundOptions, {
          colorize: 40,
          color: mainColorHexa
        });
      }
      background = Marvel.cloudinary(background, backgroundOptions);
    } else {
      background = './img/profile-bg-default.gif';
    }

    // Background image for profile
    var backgroundProfile = _.get(data, 'images.background');
    if (backgroundProfile) {
      var backgroundProfileOptions = {
        width: 600,
        quality: 90,
        crop: 'scale',
        format: 'auto'
      };
      if (mainColorHexa) {
        backgroundProfileOptions = _extends({}, backgroundProfileOptions, {
          colorize: 40,
          color: mainColorHexa
        });
      }
      backgroundProfile = Marvel.cloudinary(backgroundProfile, backgroundProfileOptions);
    } else {
      backgroundProfile = './img/profile-bg-default.gif';
    }

    // All items are defered loading their images until in viewport, except
    // the 4 first
    var inViewport = false;
    if (Marvel.lazyloadCounter === undefined || Marvel.lazyloadCounter < 4) {
      inViewport = true;
    }
    Marvel.lazyloadCounter++;

    // If the match is not obvious (not in the name of description), we display
    // where it is found
    var matchingAttributes = Marvel.getMatchingAttributes(data);
    var readableMatchingAttributes = [];
    var isFoundInName = _.has(matchingAttributes, 'name');
    var isFoundInDescription = _.has(matchingAttributes, 'description');
    if (!isFoundInName && !isFoundInDescription) {
      // Merging aliases and secret identities
      var hasAliases = _.has(matchingAttributes, 'aliases');
      var hasSecretIdentities = _.has(matchingAttributes, 'secretIdentities');
      if (hasAliases || hasSecretIdentities) {
        matchingAttributes.aliases = _.concat(_.get(matchingAttributes, 'aliases', []), _.get(matchingAttributes, 'secretIdentities', []));
        delete matchingAttributes.secretIdentities;
      }

      var readableTitles = {
        aliases: 'Also known as',
        authors: 'Authors',
        powers: 'Powers',
        teams: 'Teams'
      };
      _.each(matchingAttributes, function (value, key) {
        if (_.isArray(value)) {
          value = value.join(', ');
        }
        readableMatchingAttributes.push({
          label: readableTitles[key],
          value: value
        });
      });
    }
    var isMatchingInNotDisplayedAttributes = !_.isEmpty(readableMatchingAttributes);

    var displayData = {
      uuid: data.objectID,
      name: data.name,
      description: data.description,
      highlightedName: Marvel.getHighlightedValue(data, 'name'),
      highlightedDescription: Marvel.getHighlightedValue(data, 'description'),
      inViewport: inViewport,
      mainColorRgb: mainColorRgb,
      mainColorHexa: mainColorHexa,
      thumbnail: thumbnail,
      background: background,
      matchingAttributes: readableMatchingAttributes,
      isMatchingInNotDisplayedAttributes: isMatchingInNotDisplayedAttributes,
      // Used by the profile only
      backgroundProfile: backgroundProfile,
      urls: data.urls,
      teams: data.teams,
      powers: data.powers,
      species: data.species,
      authors: data.authors
    };

    return _extends({}, displayData, {
      json: JSON.stringify(displayData)
    });
  },
  transformProfileData: function transformProfileData(data) {
    // Enhance facets (isRefined, hasType)
    var facetNames = ['teams', 'powers', 'species', 'authors'];

    // Keep record of current filters
    var refinements = {};
    _.each(facetNames, function (facetName) {
      var facetRefinements = Marvel.search.helper.getRefinements(facetName);
      refinements[facetName] = _.map(facetRefinements, function (refinement) {
        return refinement.value;
      });
    });

    // Create an array of objects for each facet name
    var facets = {};
    _.each(facetNames, function (facetName) {
      facets[facetName] = _.map(data[facetName], function (facetValue) {
        return {
          value: facetValue,
          isRefined: _.includes(refinements[facetName], facetValue)
        };
      });
    });

    // Get an object to tell us if the character has values for this facets
    var hasFacets = _.mapValues(facets, function (value, key) {
      return key.length > 0;
    });

    var profileData = {
      uuid: data.uuid,
      name: data.name,
      description: data.description,
      facets: facets,
      hasFacets: hasFacets,
      urls: data.urls,
      mainColorHexa: data.mainColorHexa,
      thumbnail: data.thumbnail,
      background: data.backgroundProfile
    };

    console.info(profileData);

    return profileData;
  },
  getMatchingAttributes: function getMatchingAttributes(data) {
    var highlightedResults = data._highlightResult;
    if (!highlightedResults) {
      return {};
    }
    var matchingAttributes = {};
    _.each(highlightedResults, function (highlightValue, attributeName) {
      // Matching in a string attribute
      if (_.isObject(highlightValue) && highlightValue.matchLevel === 'full') {
        matchingAttributes[attributeName] = highlightValue.value;
        return;
      }
      // Matching in an array
      if (_.isArray(highlightValue)) {
        matchingAttributes[attributeName] = _.compact(_.map(highlightValue, function (matchValue) {
          if (matchValue.matchLevel === 'none') {
            return null;
          }
          return matchValue.value;
        }));
      }
    });

    return _.omitBy(matchingAttributes, _.isEmpty);
  },
  getHighlightedValue: function getHighlightedValue(object, property) {
    if (!_.has(object, '_highlightResult.' + property + '.value')) {
      return object[property];
    }
    return object._highlightResult[property].value;
  },

  // Enable lazyloading of images below the fold
  onRender: function onRender() {
    var hits = $('.hit');
    function onVisible(hit) {
      $(hit).addClass('hit__inViewport');
    }
    _.each(hits, function (hit) {
      inViewport(hit, { offset: 50 }, onVisible);
    });
  },
  addSearchBoxWidget: function addSearchBoxWidget() {
    this.search.addWidget(instantsearch.widgets.searchBox({
      container: '#q',
      placeholder: 'Search for any character, power, secret identity'
    }));
  },
  addStatsWidget: function addStatsWidget() {
    this.search.addWidget(instantsearch.widgets.stats({
      container: '#stats'
    }));
  },
  addTeamsWidget: function addTeamsWidget() {
    this.search.addWidget(instantsearch.widgets.refinementList({
      container: '#teams',
      attributeName: 'teams',
      operator: 'and',
      limit: 10,
      sortBy: ['isRefined', 'count:desc', 'name:asc'],
      showMore: {
        limit: 20
      }
    }));
  },
  addPowersWidget: function addPowersWidget() {
    this.search.addWidget(instantsearch.widgets.refinementList({
      container: '#powers',
      attributeName: 'powers',
      operator: 'and',
      limit: 10,
      sortBy: ['isRefined', 'count:desc', 'name:asc'],
      showMore: {
        limit: 20
      }
    }));
  },
  addAuthorsWidget: function addAuthorsWidget() {
    this.search.addWidget(instantsearch.widgets.refinementList({
      container: '#authors',
      attributeName: 'authors',
      operator: 'and',
      limit: 10,
      sortBy: ['isRefined', 'count:desc', 'name:asc'],
      showMore: {
        limit: 20
      }
    }));
  },
  addSpeciesWidget: function addSpeciesWidget() {
    this.search.addWidget(instantsearch.widgets.refinementList({
      container: '#species',
      attributeName: 'species',
      operator: 'or',
      limit: 10,
      sortBy: ['isRefined', 'count:desc', 'name:asc']
    }));
  },
  addHitsWidget: function addHitsWidget() {
    var hitTemplate = $('#hitTemplate').html();
    var emptyTemplate = $('#noResultsTemplate').html();
    this.search.addWidget(instantsearch.widgets.hits({
      container: '#hits',
      hitsPerPage: 10,
      templates: {
        empty: emptyTemplate,
        item: hitTemplate
      },
      transformData: {
        item: Marvel.transformItem
      }
    }));
  },
  addPaginationWidget: function addPaginationWidget() {
    this.search.addWidget(instantsearch.widgets.pagination({
      container: '#pagination',
      labels: {
        previous: '‹ Previous',
        next: 'Next ›'
      },
      showFirstLast: false
    }));
  },
  addRefinementList: function addRefinementList() {
    this.search.addWidget(instantsearch.widgets.currentRefinedValues({
      container: '#current-refined-values',
      clearAll: 'before'
    }));
  },
  addOpenProfile: function addOpenProfile() {
    var _this = this;

    var container = $('.js-container');
    var template = Hogan.compile($('#profileTemplate').html());
    var profile = $('.js-profile');
    function closeProfile() {
      container.removeClass('l-container__withProfile');
    }

    // Clicking a result will open the profile, render the template and put it
    // in the profile
    $('.hits').on('click', '.hit', function (event) {
      container.addClass('l-container__withProfile');
      var hit = event.currentTarget;
      var json = $(hit).find('.js-hit--json-holder').text();
      var data = Marvel.transformProfileData(JSON.parse(json));
      profile.html(template.render(data));
    });

    // Let users close it
    profile.on('click', '.js-profile--close', closeProfile);

    // Let user add/remove refinements when clicking on it
    profile.on('click', '.js-profile--facet', function (_event) {
      var target = $(_event.currentTarget);
      var facetName = target.data('facet-name');
      var facetValue = target.text();
      _this.search.helper.toggleRefinement(facetName, facetValue).search();
      target.toggleClass('profile--facet__isRefined');
    });
  }
};

exports.default = Marvel;

});

