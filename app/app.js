let Marvel = {
  init() {
    this.search = instantsearch({
      appId: 'O3F8QXYK6R',
      apiKey: '78e45b023b7ff7d8ba88c59c9db19890',
      indexName: 'marvel'
    });

    this.addSearchBoxWidget();
    this.addStatsWidget();
    this.addTeamsWidget();
    this.addAuthorsWidget();
    this.addPowersWidget();
    this.addSpeciesWidget();
    this.addHitsWidget();
    this.addPaginationWidget();
    this.addRefinementList();
    this.renderHits();

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
    data.powersSummary = data.powers.slice(0, 5);
    data.data = JSON.stringify(data);
    
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
  },
  addRefinementList(){
    this.search.addWidget(
      instantsearch.widgets.currentRefinedValues({
        container: '#current-refined-values',
        clearAll: 'after'
      })
    );
  },
  renderHits(){
    var renderedHits = {
      render: function(options) {
        processHeroProfile();
      }
    };

    this.search.addWidget(renderedHits);
  }

};

export default Marvel;

function processHeroProfile(){

  var hit = $('.btn-profile'),
      results = $('.hits'),
      profile = $('.hero-profile'),
      profileHeader = $('.profile-header'),
      profileName = $('.hero-profile .hero-name'),
      profileRealName = $('.hero-profile .hero-secret-identity'),
      profileAvatar = $('.hero-profile .hero-avatar img'),
      profileDescription = $('.hero-profile .hero-description'),
      profilePartners = $('.hero-profile .hero-partners'),
      profileHeroVillain = $('.hero-profile .hero-statement'),
      profilePowers = $('.hero-profile .hero-powers');
  
  hit.each(function(){
    $(this).click(function(e,t){
      var $this = $(this);
      var datas = $(this).closest('.hit').find('.dump').val(),
          datas = $.parseJSON(datas);

          console.log(datas)
      
      // Fetch & define values
      var
      heroName = datas.name,
      heroSecretId = datas.secretIdentities,
      heroAvatar = datas.image.thumnail,
      heroBanner = datas.image.banner,
      heroBackground = datas.image.background,
      heroDesc = datas.description,
      heroPowers = datas.powers,
      heroPartners = datas.partners,
      isHero = datas.isHero,
      isVillain = datas.isVillain;

     
      // Appy them
      profileName.html(heroName);
      profileAvatar.attr('src', heroAvatar);
      profileDescription.html('<p>'+heroDesc+'</p>');
      profileRealName.html(heroSecretId)

      // Give the profile header the proper images
      profileHeader.background = 'url(' + heroBackground + ')no-repeat center center / cover';

      // Check if he is a hero, a vilain, both, or null
      if(isHero && !isVillain) {
        profileHeroVillain.html('He is a hero <span class="hero-badge"></span>')
      }
      if(isVillain && !isHero) {
        profileHeroVillain.html('He is a Villain <span class="villain-badge"></span>')
      }
      if(!isHero && !isVillain) {
        profileHeroVillain.html('He is both a hero and a villain <span class="hero-villain-badge"></span>')
      }
      if(isHero==null && isVillain==null){
        profileBothHeroVillain.html('Unknown')
      }
      // Also, give the profile data attributes
      // Can be useful for next designs steps
      profile.attr({
        'data-hero': isHero,
        'data-villain': isVillain
      });

      // Loop & wrap all the powers
      profilePowers.html('');
      var power = '';
      $.each(heroPowers, function (index, key){
        power += "<span class='power'>"+key+"</span>"; 
      });
      profilePowers.append(power);
      
      // Loop & wrap all the partners
      profilePartners.html('');
      var partner = '';
      $.each(heroPartners, function (index, key){
        partner += "<span class='partner'>"+key+"</span>, "; 
      });
      profilePartners.append(partner);


      
      if(!results.hasClass('open')){
        results.addClass('open')
        profile.addClass('shown')
      }
    });
  })
}

function imageDimensions($url) {
  var u = $url;

}
///////////////////////////
/// Toggle hero-profile \\\ 
///////////////////////////
// function processHeroProfile(){
//   var hit = document.querySelectorAll('.hit'),
//       results = document.querySelector('.hits'),
//       profile = document.querySelector('.hero-profile');
//   for(var i=0;i<hit.length;i++){
//     hit[i].addEventListener('click', function(){
//       alert()
//       if(!results.classList.contains('open')){
//         results.classList.add('open')
//         profile.classList.add('shown')
//       } else {
//         results.classList.remove('open')
//         profile.classList.remove('shown')
//       }
//     })
//   }
// }


// window.onload = function(){
//   processHeroProfile()
// }






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
