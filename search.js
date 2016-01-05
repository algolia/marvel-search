/* global instantsearch */

var search = instantsearch({
  appId: 'O3F8QXYK6R',
  apiKey: '78e45b023b7ff7d8ba88c59c9db19890',
  indexName: 'marvel',
  urlSync: true
});

search.addWidget(
  instantsearch.widgets.searchBox({
    container: '#q',
    placeholder: 'Search any superhero or supervillain'
  })
);

var hitTemplate = $('#hitTemplate').html();

var noResultsTemplate =
  '<div class="text-center">No results for <strong>{{query}}</strong>.</div>';


search.addWidget(
  instantsearch.widgets.hits({
    container: '#hits',
    hitsPerPage: 200,
    templates: {
      empty: noResultsTemplate,
      item: hitTemplate
    },
    transformData: function (data) {
      if (data.creators) {
        data.creators = data.creators.join(', ');
      }
      if (data.species) {
        data.species = data.species.join(', ');
      }
      if (data._highlightResult.powersText) {
        data.powersText = _.map(data._highlightResult.powersText, 'value').join('<br>');
      }
      if (!data.image.url) {
        data.image.url = 'http://pixelastic.github.io/marvel/default.jpg';
      }
      // Use cloudinary to load smaller images
      let cloudinaryPrefix = 'http://res.cloudinary.com/demo/image/fetch/h_190,q_100,c_scale,f_auto/';
      data.image.url = `${cloudinaryPrefix}${data.image.url}`;
      return data;
    }
  })
);

search.addWidget(
  instantsearch.widgets.stats({
    container: '#stats'
  })
);

search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#creators',
    attributeName: 'creators',
    operator: 'and',
    limit: 10
  })
);

search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#teams',
    attributeName: 'teams',
    operator: 'and',
    limit: 8
  })
);

search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#species',
    attributeName: 'species',
    operator: 'and',
    limit: 5
  })
);

search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#powers',
    attributeName: 'powers',
    operator: 'and',
    limit: 8
  })
);

search.addWidget(
  instantsearch.widgets.pagination({
    container: '#pagination',
    cssClasses: {
      active: 'active'
    },
    labels: {
      previous: '<i class="fa fa-angle-left fa-2x"></i> Previous page',
      next: 'Next page <i class="fa fa-angle-right fa-2x"></i>'
    },
    showFirstLast: false
  })
);

search.addWidget(
  instantsearch.widgets.clearAll({
    container: '#clear-all',
    templates: {
      link: '<i class="fa fa-eraser"></i> Clear all filters'
    },
    cssClasses: {
      root: 'btn btn-block btn-default'
    },
    autoHideContainer: true
  })
);

search.start();

$('#q').focus();
