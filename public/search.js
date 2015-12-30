/* global instantsearch */

var search = instantsearch({
  appId: 'O3F8QXYK6R',
  apiKey: '78e45b023b7ff7d8ba88c59c9db19890',
  indexName: 'marvel'
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
        data.image.url = './default.jpg';
      }
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



search.start();

$('#q').focus();
