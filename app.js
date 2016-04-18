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
    var baseUrl = 'http://res.cloudinary.com/pixelastic-marvel/image/fetch/';
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

    var displayData = {
      uuid: data.objectID,
      name: Marvel.getHighlightedValue(data, 'name'),
      description: Marvel.getHighlightedValue(data, 'description'),
      inViewport: inViewport,
      mainColorRgb: mainColorRgb,
      mainColorHexa: mainColorHexa,
      thumbnail: thumbnail,
      background: background,
      profile: {
        uuid: data.objectID,
        name: data.name,
        description: data.description,
        secretIdentity: data.secretIdentities[0],
        powers: data.powers,
        hasPowers: !!data.powers.length,
        teams: data.teams,
        hasTeams: !!data.teams.length,
        partners: data.partners,
        hasPartners: !!data.partners.length,
        species: data.species,
        hasSpecies: !!data.species.length,
        authors: data.authors,
        hasAuthors: !!data.authors.length,
        urls: data.urls,
        mainColorHexa: mainColorHexa,
        thumbnail: thumbnail,
        background: backgroundProfile
      }
    };

    return _extends({}, displayData, {
      json: JSON.stringify(displayData)
    });
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
      limit: 10
    }));
  },
  addAuthorsWidget: function addAuthorsWidget() {
    this.search.addWidget(instantsearch.widgets.refinementList({
      container: '#authors',
      attributeName: 'authors',
      operator: 'and',
      limit: 5
    }));
  },
  addSpeciesWidget: function addSpeciesWidget() {
    this.search.addWidget(instantsearch.widgets.refinementList({
      container: '#species',
      attributeName: 'species',
      operator: 'or',
      limit: 10
    }));
  },
  addPowersWidget: function addPowersWidget() {
    this.search.addWidget(instantsearch.widgets.refinementList({
      container: '#powers',
      attributeName: 'powers',
      operator: 'and',
      limit: 10
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
      cssClasses: {
        active: 'active'
      },
      labels: {
        previous: '<i class="fa fa-angle-left fa-2x"></i> Previous page',
        next: 'Next page <i class="fa fa-angle-right fa-2x"></i>'
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
    var container = $('.js-container');
    var template = Hogan.compile($('#profileTemplate').html());
    var profile = $('.js-profile');

    // Clicking a result will open the profile, render the template and put it
    // in the profile
    $('.hits').on('click', '.hit', function (event) {
      container.addClass('l-container__withProfile');
      var hit = event.currentTarget;
      var json = $(hit).find('.js-hit--json-holder').text();
      var data = JSON.parse(json).profile;
      profile.html(template.render(data));
    });

    // Let users close it
    $('.js-profile').on('click', '.js-profile--close', function (_event) {
      container.removeClass('l-container__withProfile');
    });
  }
};

exports.default = Marvel;

});

