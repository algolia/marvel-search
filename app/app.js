let Marvel = {
  init() {
    this.search = instantsearch({
      appId: 'O3F8QXYK6R',
      apiKey: '78e45b023b7ff7d8ba88c59c9db19890',
      indexName: 'marvel',
      urlSync: true,
      searchFunction: (helper) => {
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
  cloudinary(url, options) {
    let baseUrl = 'http://res.cloudinary.com/pixelastic-marvel/image/fetch/';
    let stringOptions = [];

    // Handle common Cloudinary options
    if (options.width) {
      stringOptions.push(`w_${options.width}`);
    }
    if (options.height) {
      stringOptions.push(`h_${options.height}`);
    }
    if (options.quality) {
      stringOptions.push(`q_${options.quality}`);
    }
    if (options.crop) {
      stringOptions.push(`c_${options.crop}`);
    }
    if (options.format) {
      stringOptions.push(`f_${options.format}`);
    }
    if (options.colorize) {
      stringOptions.push(`e_colorize:${options.colorize}`);
    }
    if (options.color) {
      stringOptions.push(`co_rgb:${options.color}`);
    }
    if (options.gravity) {
      stringOptions.push(`g_${options.gravity}`);
    }

    // Fix remote urls
    url = url.replace(/^\/\//, 'http://');


    return `${baseUrl}${stringOptions.join(',')}/${url}`;
  },
  transformItem(data) {
    // Main color
    let mainColorHexa = _.get(data, 'mainColor.hexa');
    let mainColorRgb = null;
    if (mainColorHexa) {
      mainColorRgb = `${data.mainColor.red},${data.mainColor.green},${data.mainColor.blue}`;
    }

    // Thumbnail
    let thumbnail = _.get(data, 'images.thumbnail');
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
    let background = _.get(data, 'images.background');
    if (background) {
      let backgroundOptions = {
        width: 450,
        quality: 90,
        crop: 'scale',
        format: 'auto'
      };
      if (mainColorHexa) {
        backgroundOptions = {
          ...backgroundOptions,
          colorize: 40,
          color: mainColorHexa
        };
      }
      background = Marvel.cloudinary(background, backgroundOptions);
    } else {
      background = './img/profile-bg-default.gif';
    }

    // Background image for profile
    let backgroundProfile = _.get(data, 'images.background');
    if (backgroundProfile) {
      let backgroundProfileOptions = {
        width: 600,
        quality: 90,
        crop: 'scale',
        format: 'auto'
      };
      if (mainColorHexa) {
        backgroundProfileOptions = {
          ...backgroundProfileOptions,
          colorize: 40,
          color: mainColorHexa
        };
      }
      backgroundProfile = Marvel.cloudinary(backgroundProfile, backgroundProfileOptions);
    } else {
      backgroundProfile = './img/profile-bg-default.gif';
    }

    // All items are defered loading their images until in viewport, except
    // the 4 first
    let inViewport = false;
    if (Marvel.lazyloadCounter === undefined || Marvel.lazyloadCounter < 4) {
      inViewport = true;
    }
    Marvel.lazyloadCounter++;

    // If the match is not obvious (not in the name of description), we display
    // where it is found
    let matchingAttributes = Marvel.getMatchingAttributes(data);
    let readableMatchingAttributes = [];
    let isFoundInName = _.has(matchingAttributes, 'name');
    let isFoundInDescription = _.has(matchingAttributes, 'description');
    if (!isFoundInName && !isFoundInDescription) {
      // Merging aliases and secret identities
      let hasAliases = _.has(matchingAttributes, 'aliases');
      let hasSecretIdentities = _.has(matchingAttributes, 'secretIdentities');
      if (hasAliases || hasSecretIdentities) {
        matchingAttributes.aliases = _.concat(
          _.get(matchingAttributes, 'aliases', []),
          _.get(matchingAttributes, 'secretIdentities', [])
        );
        delete matchingAttributes.secretIdentities;
      }

      let readableTitles = {
        aliases: 'Also known as',
        authors: 'Authors',
        powers: 'Powers',
        teams: 'Teams'
      };
      _.each(matchingAttributes, (value, key) => {
        if (_.isArray(value)) {
          value = value.join(', ');
        }
        readableMatchingAttributes.push({
          label: readableTitles[key],
          value
        });
      });
    }
    let isMatchingInNotDisplayedAttributes = !_.isEmpty(readableMatchingAttributes);

    let displayData = {
      uuid: data.objectID,
      name: data.name,
      description: data.description,
      highlightedName: Marvel.getHighlightedValue(data, 'name'),
      highlightedDescription: Marvel.getHighlightedValue(data, 'description'),
      inViewport,
      mainColorRgb,
      mainColorHexa,
      thumbnail,
      background,
      matchingAttributes: readableMatchingAttributes,
      isMatchingInNotDisplayedAttributes,
      // Used by the profile only
      backgroundProfile,
      urls: data.urls,
      teams: data.teams,
      powers: data.powers,
      species: data.species,
      authors: data.authors
    };

    return {
      ...displayData,
      json: JSON.stringify(displayData)
    };
  },
  transformProfileData(data) {
    // Enhance facets (isRefined, hasType)
    let facetNames = ['teams', 'powers', 'species', 'authors'];

    // Keep record of current filters
    let refinements = {};
    _.each(facetNames, (facetName) => {
      let facetRefinements = Marvel.search.helper.getRefinements(facetName);
      refinements[facetName] = _.map(facetRefinements, (refinement) => {
        return refinement.value;
      });
    });

    // Create an array of objects for each facet name
    let facets = {};
    _.each(facetNames, (facetName) => {
      facets[facetName] = _.map(data[facetName], (facetValue) => {
        return {
          value: facetValue,
          isRefined: _.includes(refinements[facetName], facetValue)
        };
      });
    });

    // Get an object to tell us if the character has values for this facets
    let hasFacets = _.mapValues(facets, (value, key) => {
      return key.length > 0;
    });

    let profileData = {
      uuid: data.uuid,
      name: data.name,
      description: data.description,
      facets,
      hasFacets,
      urls: data.urls,
      mainColorHexa: data.mainColorHexa,
      thumbnail: data.thumbnail,
      background: data.backgroundProfile
    };

    console.info(profileData);

    return profileData;
  },
  getMatchingAttributes(data) {
    let highlightedResults = data._highlightResult;
    if (!highlightedResults) {
      return {};
    }
    let matchingAttributes = {};
    _.each(highlightedResults, (highlightValue, attributeName) => {
      // Matching in a string attribute
      if (_.isObject(highlightValue) && highlightValue.matchLevel === 'full') {
        matchingAttributes[attributeName] = highlightValue.value;
        return;
      }
      // Matching in an array
      if (_.isArray(highlightValue)) {
        matchingAttributes[attributeName] = _.compact(_.map(highlightValue, (matchValue) => {
          if (matchValue.matchLevel === 'none') {
            return null;
          }
          return matchValue.value;
        }));
      }
    });

    return _.omitBy(matchingAttributes, _.isEmpty);
  },
  getHighlightedValue(object, property) {
    if (!_.has(object, `_highlightResult.${property}.value`)) {
      return object[property];
    }
    return object._highlightResult[property].value;
  },
  // Enable lazyloading of images below the fold
  onRender() {
    let hits = $('.hit');
    function onVisible(hit) {
      $(hit).addClass('hit__inViewport');
    }
    _.each(hits, (hit) => {
      inViewport(hit, {offset: 50}, onVisible);
    });
  },
  addSearchBoxWidget() {
    this.search.addWidget(
      instantsearch.widgets.searchBox({
        container: '#q',
        placeholder: 'Search for any character, power, secret identity'
      })
    );
  },
  addStatsWidget() {
    this.search.addWidget(
      instantsearch.widgets.stats({
        container: '#stats'
      })
    );
  },
  addTeamsWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#teams',
        attributeName: 'teams',
        operator: 'and',
        limit: 10,
        sortBy: ['isRefined', 'count:desc', 'name:asc'],
        showMore: {
          limit: 20
        }
      })
    );
  },
  addPowersWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#powers',
        attributeName: 'powers',
        operator: 'and',
        limit: 10,
        sortBy: ['isRefined', 'count:desc', 'name:asc'],
        showMore: {
          limit: 20
        }
      })
    );
  },
  addAuthorsWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#authors',
        attributeName: 'authors',
        operator: 'and',
        limit: 10,
        sortBy: ['isRefined', 'count:desc', 'name:asc'],
        showMore: {
          limit: 20
        }
      })
    );
  },
  addSpeciesWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#species',
        attributeName: 'species',
        operator: 'or',
        limit: 10,
        sortBy: ['isRefined', 'count:desc', 'name:asc']
      })
    );
  },
  addHitsWidget() {
    let hitTemplate = $('#hitTemplate').html();
    let emptyTemplate = $('#noResultsTemplate').html();
    this.search.addWidget(
      instantsearch.widgets.hits({
        container: '#hits',
        hitsPerPage: 10,
        templates: {
          empty: emptyTemplate,
          item: hitTemplate
        },
        transformData: {
          item: Marvel.transformItem
        }
      })
    );
  },
  addPaginationWidget() {
    this.search.addWidget(
      instantsearch.widgets.pagination({
        container: '#pagination',
        labels: {
          previous: '‹ Previous',
          next: 'Next ›'
        },
        showFirstLast: false
      })
    );
  },
  addRefinementList() {
    this.search.addWidget(
      instantsearch.widgets.currentRefinedValues({
        container: '#current-refined-values',
        clearAll: 'before'
      })
    );
  },
  addOpenProfile() {
    let container = $('.js-container');
    let template = Hogan.compile($('#profileTemplate').html());
    let profile = $('.js-profile');
    function closeProfile() {
      container.removeClass('l-container__withProfile');
    }

    // Clicking a result will open the profile, render the template and put it
    // in the profile
    $('.hits').on('click', '.hit', (event) => {
      container.addClass('l-container__withProfile');
      let hit = event.currentTarget;
      let json = $(hit).find('.js-hit--json-holder').text();
      let data = Marvel.transformProfileData(JSON.parse(json));
      profile.html(template.render(data));
    });

    // Let users close it
    profile.on('click', '.js-profile--close', closeProfile);

    // Let user add/remove refinements when clicking on it
    profile.on('click', '.js-profile--facet', (_event) => {
      let target = $(_event.currentTarget);
      let facetName = target.data('facet-name');
      let facetValue = target.text();
      this.search.helper.toggleRefinement(facetName, facetValue).search();
      target.toggleClass('profile--facet__isRefined');
    });
  }
};

export default Marvel;
