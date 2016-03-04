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
      profileHeader = $('.hero-profile header'),
      profileName = $('.hero-profile .hero-name'),
      profileRealName = $('.hero-profile .hero-secret-identity'),
      profileAvatar = $('.hero-profile .hero-avatar img'),
      profileDescription = $('.hero-profile .hero-description'),
      profilePartners = $('.hero-profile .hero-partners'),
      profileHeroVillain = $('.hero-profile .factions'),
      profilePowers = $('.hero-profile .hero-powers'),

      closeProfile = $('#closeProfile');

      // Add dynamic style tag
      profileHeader.prepend('<style id="dynamic-style" />');
      var dynamicStyle = $('#dynamic-style');

  // When a "view profile" button is pressed
  hit.each(function(){
    $(this).click(function(e,t){
      e.preventDefault();
      var $this = $(this);
      var datas = $(this).closest('.hit').find('.dump').val(),
          datas = $.parseJSON(datas);

      
      // Fetch & define values
      var
      heroName = datas.name,
      heroSecretId = datas.secretIdentities[0],
      heroAvatar = datas.images.thumbnail,
      heroBanner = datas.images.banner,
      heroBackground = datas.images.background || 'http://i.annihil.us/u/prod/marvel/i/mg/c/50/537bafe4149ad.gif',
      heroDesc = datas.description,
      heroPowers = datas.powers,
      heroPartners = datas.partners,
      isHero = datas.isHero,
      isVillain = datas.isVillain;

      if (_.has(datas, 'mainColor.hexa')) {
        var heroColor = colorLuminance('#' + datas.mainColor.hexa, 1.5);
      } else {
        var heroColor = '#ccc'
      }

      // Appy them
      profileName.html(heroName);
      profileAvatar.attr('src', heroAvatar);
      profileDescription.html('<p>'+heroDesc+'</p>');
      profileRealName.html(heroSecretId);




      // Add the proper colors
      profileAvatar.parent().attr('style','border-color:'+ heroColor);
      dynamicStyle.text('').text('.hero-profile header:after{background-color:'+heroColor+';}.hero-profile .hero-faction:before,.hero-profile .hero-faction:after{background: linear-gradient(to bottom, '+heroColor+', '+  colorLuminance(heroColor, 1.5)+') !important}')


      // Give the profile header the proper images
      profileHeader.attr('style','background-image:url(' + heroBackground + ');border-color:' + heroColor);

      // Check if he is a hero, a vilain, both, or null
      if(isHero && !isVillain) {
        profileHeroVillain.attr({
          'data-is-hero': 'true',
          'data-is-villain': 'false'
        })
      }
      if(isVillain && !isHero) {
        profileHeroVillain.attr({
          'data-is-hero': 'false',
          'data-is-villain': 'true'
        })
      }
      if(!isHero && !isVillain) {
        profileHeroVillain.attr({
          'data-is-hero': 'true',
          'data-is-villain': 'true'
        })
      }
      if(isHero===null && isVillain===null){
        profileHeroVillain.attr({
          'data-is-hero': 'false',
          'data-is-villain': 'false'
        })
      }


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
      if(heroPartners===0){
        partner += "<span>Unknown</span>"
      } else {
        $.each(heroPartners, function (index, key){
          partner += "<span class='partner'>"+key+"</span>, "; 
        });
      }
      profilePartners.append(partner);

      
      if(!results.hasClass('open')){
        results.addClass('open')
        profile.addClass('shown')
      }
    });
  })

  // When the "close profile" button is pressed
  closeProfile.on('click', function(){
    if(results.hasClass('open')){
      results.removeClass('open')
      profile.removeClass('shown')
    }
  })
}


function colorLuminance(hex, lum) {

  // validate hex string
  hex = String(hex).replace(/[^0-9a-f]/gi, '');
  if (hex.length < 6) {
    hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  }
  lum = lum || 0;

  // convert to decimal and change luminosity
  var rgb = "#", c, i;
  for (i = 0; i < 3; i++) {
    c = parseInt(hex.substr(i*2,2), 16);
    c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
    rgb += ("00"+c).substr(c.length);
  }

  return rgb;
}
// function imageDimensions($url) {
//   var u = $url;

// }
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
