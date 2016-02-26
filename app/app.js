let Marvel = {
  init() {
    this.search = instantsearch({
      appId: 'O3F8QXYK6R',
      apiKey: '78e45b023b7ff7d8ba88c59c9db19890',
      indexName: 'marvel',
      urlSync: true
    });

    this.addSearchBoxWidget();
    this.addStatsWidget();
    this.addTeamsWidget();
    this.addAuthorsWidget();
    this.addPowersWidget();
    this.addSpeciesWidget();
    this.addHitsWidget();
    this.addPaginationWidget();

    this.search.start();
  },
  transformItem(data) {
    // Add a default image if none exists
    if (!data.image) {
      data.image = './default.jpg';
    }
    data.image = data.image.replace(/^https?:/, '');

    data.description = Marvel.getHighlightedValue(data, 'description');
    data.name = Marvel.getHighlightedValue(data, 'name');
    return data;
  },
  getHighlightedValue(object, property) {
    if (!_.has(object, `_highlightResult.${property}.value`)) {
      return object[property];
    }
    return object._highlightResult[property].value;
  },
  addSearchBoxWidget() {
    this.search.addWidget(
      instantsearch.widgets.searchBox({
        container: '#q',
        placeholder: 'Search any superhero or supervillain'
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
        limit: 10
      })
    );
  },
  addAuthorsWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#authors',
        attributeName: 'authors',
        operator: 'and',
        limit: 5
      })
    );
  },
  addSpeciesWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#species',
        attributeName: 'species',
        operator: 'or',
        limit: 10
      })
    );
  },
  addPowersWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#powers',
        attributeName: 'powers',
        operator: 'and',
        limit: 10
      })
    );
  },
  addHitsWidget() {
    let hitTemplate = $('#hitTemplate').html();
    let emptyTemplate = $('#noResultsTemplate').html();
    this.search.addWidget(
      instantsearch.widgets.hits({
        container: '#hits',
        hitsPerPage: 20,
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
  }
};

export default Marvel;










// // Returns the Marvel image if available, otherwise the one from Wikipedia.
// // Back to default if none is found
// function getImage(record) {
//   if (record.marvel && record.marvel.image) {
//     return record.marvel.image;
//   }
//   if (record.image.url) {
//     return record.image.url;
//   }
//   return 'https://pixelastic.github.io/marvel/default.jpg';
// }
// 
// // Returns Marvel description if found, list of powers otherwise
// function getDescription(record) {
//   // Si description on l'affiche
//   // sinon on affiche le power text
//   if (record.marvel && record.marvel.description) {
//     if (record._highlightResult.marvel.description) {
//       return record._highlightResult.marvel.description.value;
//     }
//     return record.marvel.description;
//   }
//   return record.powersText.join('<br>');
// }
// 
// 
// search.addWidget(
//   instantsearch.widgets.hits({
//     container: '#hits',
//     hitsPerPage: 80,
//     templates: {
//       empty: noResultsTemplate,
//       item: hitTemplate
//     },
//     transformData: {
//       item: function (data) {
//         if (data.creators) {
//           data.creators = data.creators.join(', ');
//         }
//         if (data.species) {
//           data.species = data.species.join(', ');
//         }
// 
//         data.description = getDescription(data);
// 
//         // Use cloudinary to load smaller images
//         var cloudinaryPrefix = 'http://res.cloudinary.com/pixelastic-marvel/image/fetch/h_190,q_100,c_scale,f_auto/';
//         data.image = cloudinaryPrefix + getImage(data);
// 
//         return data;
//       }
//     }
//   })
// );
// 
// search.addWidget(
//   instantsearch.widgets.stats({
//     container: '#stats'
//   })
// );
// 
// search.addWidget(
//   instantsearch.widgets.refinementList({
//     container: '#creators',
//     attributeName: 'creators',
//     operator: 'and',
//     limit: 10
//   })
// );
// 
// search.addWidget(
//   instantsearch.widgets.refinementList({
//     container: '#teams',
//     attributeName: 'teams',
//     operator: 'and',
//     limit: 8
//   })
// );
// 
// search.addWidget(
//   instantsearch.widgets.refinementList({
//     container: '#species',
//     attributeName: 'species',
//     operator: 'and',
//     limit: 5
//   })
// );
// 
// search.addWidget(
//   instantsearch.widgets.refinementList({
//     container: '#powers',
//     attributeName: 'powers',
//     operator: 'and',
//     limit: 8
//   })
// );
// 
// search.addWidget(
//   instantsearch.widgets.pagination({
//     container: '#pagination',
//     cssClasses: {
//       active: 'active'
//     },
//     labels: {
//       previous: '<i class="fa fa-angle-left fa-2x"></i> Previous page',
//       next: 'Next page <i class="fa fa-angle-right fa-2x"></i>'
//     },
//     showFirstLast: false
//   })
// );
// 
// search.addWidget(
//   instantsearch.widgets.clearAll({
//     container: '#clear-all',
//     templates: {
//       link: '<i class="fa fa-eraser"></i> Clear all filters'
//     },
//     cssClasses: {
//       root: 'btn btn-block btn-default'
//     },
//     autoHideContainer: true
//   })
// );
// 
// search.start();
// 
// $('#q').focus();
