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
    hitsPerPage: 115,
    templates: {
      empty: noResultsTemplate,
      item: hitTemplate
    },
    transformData: function(data) {
      data.creators = data.creators.join(', ');
      data.species = data.species.join(', ');
      data.powersText = data.powersText.join('<br>');
      return data;
    }
  })
);

search.addWidget(
  instantsearch.widgets.stats({
    container: '#stats'
  })
);


search.start();

$('#q').focus();
