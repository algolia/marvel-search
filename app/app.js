// TODO:
// Add background comic image on each hit. Change color on hover?
// Set color of highlight based on character color?
//
// Clicking on one character will open the profile page
// Display more information
// Side if enough space
//  => Reduce width of characters accordingly
//  => If space for only one, display on the bottom
//
//  When matching an alias or a power, display it
//

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

    this.addLogoClear();

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
        // colorize: 40,
        // color: mainColorHexa
      });
    } else {
      thumbnail = './img/hit-default.jpg';
    }

    // Background image
    let background = _.get(data, 'images.background');
    if (background) {
      background = Marvel.cloudinary(background, {
        width: 450,
        quality: 90,
        crop: 'scale',
        format: 'auto',
        colorize: 40,
        color: mainColorHexa
      });
    } else {
      background = './img/profile-bg-default.gif';
    }

    // All items are defered loading their images until in viewport, except
    // the 4 first
    let inViewport = false;
    if (Marvel.lazyloadCounter === undefined || Marvel.lazyloadCounter < 4) {
      console.info('show', data);
      inViewport = true;
    }
    Marvel.lazyloadCounter++;

    return {
      uuid: data.objectID,
      name: Marvel.getHighlightedValue(data, 'name'),
      description: Marvel.getHighlightedValue(data, 'description'),
      inViewport,
      mainColorHexa,
      mainColorRgb,
      thumbnail,
      background
    };
    // data.data = JSON.stringify(data);
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
  addRefinementList() {
    this.search.addWidget(
      instantsearch.widgets.currentRefinedValues({
        container: '#current-refined-values',
        clearAll: 'before'
      })
    );
  },
  addLogoClear() {
    this.search.addWidget(
      instantsearch.widgets.clearAll({
        container: '#header--logo',
        templates: {
          link: '<img src="img/logo-marvel.svg" class="header--logo"/>'
        },
        autoHideContainer: false
      })
    );
  },
  addHits() {
    // this.search.addWidget(renderedHits);
    // var renderedHits = {
    //   render: function(options) {
    //     processHeroProfile();
    //   }
    // };
  },
  // Apply luminance to a given hexadecimal color
  colorLuminance(hex, lum) {

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

};

export default Marvel;

// function processHeroProfile(){
// 
//   var hit = $('.hit'),
//       results = $('.hits'),
//       profile = $('.hero-profile'),
//       profileHeader = $('.hero-profile header'),
//       profileName = $('.hero-profile .hero-name'),
//       profileRealName = $('.hero-profile .hero-secret-identity'),
//       profileAvatar = $('.hero-profile .hero-avatar img'),
//       profileDescription = $('.hero-profile .hero-description'),
//       profilePartners = $('.hero-profile .hero-partners'),
//       profileHeroVillain = $('.hero-profile .factions'),
//       profilePowers = $('.hero-profile .hero-powers'),
// 
//       closeProfile = $('#closeProfile');
// 
//       // Add dynamic style tag
//       profileHeader.prepend('<style id="dynamic-style" />');
//       var dynamicStyle = $('#dynamic-style');
// 
//   // When a "view profile" button is pressed
//   hit.each(function(){
//     $(this).click(function(e,t){
//       e.preventDefault();
//       var $this = $(this);
//       var datas = $(this).closest('.hit').find('.dump').val(),
//           datas = $.parseJSON(datas);
// 
// 
//       // Fetch & define values
//       var
//       heroName = datas.name,
//       heroSecretId = datas.secretIdentities[0],
//       heroAvatar = datas.images.thumbnail || './default.jpg',
//       heroBanner = datas.images.banner,
//       heroBackground = datas.images.background || 'http://i.annihil.us/u/prod/marvel/i/mg/c/50/537bafe4149ad.gif',
//       heroDesc = datas.description,
//       heroPowers = datas.powers,
//       heroPartners = datas.partners,
//       isHero = datas.isHero,
//       isVillain = datas.isVillain;
// 
//       if (_.has(datas, 'mainColor.hexa')) {
//         var heroColor = colorLuminance('#' + datas.mainColor.hexa, 1.5);
//       } else {
//         var heroColor = '#ccc'
//       }
// 
//       // Appy them
//       profileName.html(heroName);
//       profileAvatar.attr('src', heroAvatar);
//       profileDescription.html('<p>'+heroDesc+'</p>');
//       profileRealName.html(heroSecretId);
// 
// 
// 
// 
//       // Add the proper colors
//       profileAvatar.parent().attr('style','border-color:'+ heroColor);
//       dynamicStyle.text('').text('.hero-profile header:after{background-color:'+heroColor+';}.hero-profile .hero-faction:before,.hero-profile .hero-faction:after{background: linear-gradient(to bottom, '+heroColor+', '+  colorLuminance(heroColor, 1.5)+') !important}')
// 
// 
//       // Give the profile header the proper images
//       profileHeader.attr('style','background-image:url(' + heroBackground + ');border-color:' + heroColor);
// 
//       // Check if he is a hero, a vilain, both, or null
//       if(isHero && !isVillain) {
//         profileHeroVillain.attr({
//           'data-is-hero': 'true',
//           'data-is-villain': 'false'
//         })
//       }
//       if(isVillain && !isHero) {
//         profileHeroVillain.attr({
//           'data-is-hero': 'false',
//           'data-is-villain': 'true'
//         })
//       }
//       if(!isHero && !isVillain) {
//         profileHeroVillain.attr({
//           'data-is-hero': 'true',
//           'data-is-villain': 'true'
//         })
//       }
//       if(isHero===null && isVillain===null){
//         profileHeroVillain.attr({
//           'data-is-hero': 'false',
//           'data-is-villain': 'false'
//         })
//       }
// 
// 
//       // Loop & wrap all the powers
//       profilePowers.html('');
//       var power = '';
//       $.each(heroPowers, function (index, key){
//         power += "<span class='power'>"+key+"</span>";
//       });
//       profilePowers.append(power);
// 
//       // Loop & wrap all the partners
//       profilePartners.html('');
//       var partner = '';
//       if(heroPartners==0){
//         partner += "Unknown"
//       } else {
//         $.each(heroPartners, function (index, key){
//           partner = "<span class='partner'>"+key+"</span>, ";
//         });
//       }
//       profilePartners.append(partner);
// 
// 
//       if(!results.hasClass('open')){
//         results.addClass('open')
//         profile.addClass('shown')
//       }
//     });
//   });
// 
//   // When the "close profile" button is pressed
//   closeProfile.on('click', function(){
//     if(results.hasClass('open')){
//       results.removeClass('open')
//       profile.removeClass('shown')
//     }
//   });
// }


