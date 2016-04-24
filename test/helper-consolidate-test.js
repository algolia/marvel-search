/* eslint-env mocha */
import sinon from 'sinon';
import expect from 'expect';
import Helper from '../lib/utils/helper-consolidate.js';

describe('HelperConsolidate', () => {
  afterEach(() => {
    cleanUpStubs(Helper);
  });

  describe('isCustomIdentityName', () => {
    it('should return false for classic names', () => {
      // Given
      let input = 'Abomination';

      // When
      let actual = Helper.isCustomIdentityName(input);

      // Then
      expect(actual).toEqual(false);
    });
  });

  describe('getCustomIdentity', () => {
    it('should only set the superName if not a secret identity', () => {
      // Given
      let input = 'Abomination';

      // When
      let actual = Helper.getCustomIdentity(input);

      // Then
      expect(actual.superName).toEqual('Abomination');
      expect(actual.realName).toEqual(null);
    });

    it('should set superName and realName', () => {
      // Given
      let input = 'American Eagle (Jason Strongbow)';

      // When
      let actual = Helper.getCustomIdentity(input);

      // Then
      expect(actual.superName).toEqual('American Eagle');
      expect(actual.realName).toEqual('Jason Strongbow');
    });
  });

  describe('isLooselyEqual', () => {
    it('should work on exact matches', () => {
      // Given
      let input = 'foo';
      let list = 'foo';

      // When
      let actual = Helper.isLooselyEqual(input, list);

      // Then
      expect(actual).toEqual(true);
    });

    it('should work on loose matches', () => {
      // Given
      let input = 'foo bar';
      let list = 'foo baz bar';

      // When
      let actual = Helper.isLooselyEqual(input, list);

      // Then
      expect(actual).toEqual(true);
    });

    it('falsy strings are never equals to anything', () => {
      expect(Helper.isLooselyEqual(null, 'foo')).toEqual(false);
      expect(Helper.isLooselyEqual(undefined, 'foo')).toEqual(false);
      expect(Helper.isLooselyEqual('', 'foo')).toEqual(false);
      expect(Helper.isLooselyEqual('foo', null)).toEqual(false);
      expect(Helper.isLooselyEqual('foo', undefined)).toEqual(false);
      expect(Helper.isLooselyEqual('foo', '')).toEqual(false);
    });
  });

  describe('isLooselyIncluded', () => {
    it('should work on exact matches', () => {
      // Given
      let input = 'foo';
      let list = [
        'foo'
      ];

      // When
      let actual = Helper.isLooselyIncluded(input, list);

      // Then
      expect(actual).toEqual(true);
    });

    it('should work on loose matches', () => {
      // Given
      let input = 'foo bar';
      let list = [
        'foo baz bar'
      ];

      // When
      let actual = Helper.isLooselyIncluded(input, list);

      // Then
      expect(actual).toEqual(true);
    });
  });

  describe('pickDataForCharacter', () => {
    describe('no match', () => {
      it('should return null if nothing matches', () => {
        // Given
        let character = {
          infoboxData: {
            name: 'Wolverine'
          }
        };
        let marvelCharacters = {
          Thor: 'bad'
        };

        // When
        let actual = Helper.pickDataForCharacter(character, marvelCharacters);

        // Then
        expect(actual).toEqual(null);
      });

      it('should return null if only specific identities', () => {
        // Given
        let character = {
          infoboxData: {
            name: 'Angel Salvadore'
          }
        };
        let marvelCharacters = {
          'Angel (Thomas Halloway)': 'no',
          'Angel (Warren Worthington III)': 'no'
        };

        // When
        let actual = Helper.pickDataForCharacter(character, marvelCharacters);

        // Then
        expect(actual).toEqual(null);
      });

      it('should discard characters that have multiple possible matches in secretIdentity', () => {
        // Given
        let character = {
          infoboxData: {
            name: 'Baron Zemo',
            secretIdentities: [
              'Helmut Zemo',
              'Heinrich Zemo'
            ]
          }
        };
        let marvelCharacters = {
          'Baron Zemo (Helmut Zemo)': {
            test: 'bad'
          },
          'Baron Zemo (Heinrich Zemo)': {
            test: 'bad'
          }
        };

        // When
        let actual = Helper.pickDataForCharacter(character, marvelCharacters);

        // Then
        expect(actual).toEqual(null);
      });
    });

    describe('exactMatch', () => {
      it('should pick the character that has the same name', () => {
        // Given
        let character = {
          infoboxData: {
            name: 'Thor'
          }
        };
        let marvelCharacters = {
          Thor: {
            test: 'ok'
          }
        };

        // When
        let actual = Helper.pickDataForCharacter(character, marvelCharacters);

        // Then
        expect(actual.test).toEqual('ok');
        expect(actual.pickType).toEqual('exactMatch');
      });
    });

    describe('secretIdentity', () => {
      it('should match a character with custom identity if it is one of the known secret identities', () => {
        // Given
        let character = {
          infoboxData: {
            name: 'Abomination',
            secretIdentities: [
              'Emil Blonsky'
            ]
          }
        };
        let marvelCharacters = {
          'Abomination (Emil Blonsky)': {
            test: 'ok'
          }
        };

        // When
        let actual = Helper.pickDataForCharacter(character, marvelCharacters);

        // Then
        expect(actual.test).toEqual('ok');
        expect(actual.pickType).toEqual('secretIdentity');
      });

      it('should match a character with custom identity if it is one of the known aliases', () => {
        // Given
        let character = {
          infoboxData: {
            name: 'Abomination',
            aliases: [
              'Emil Blonsky'
            ]
          }
        };
        let marvelCharacters = {
          'Abomination (Emil Blonsky)': {
            test: 'ok'
          }
        };

        // When
        let actual = Helper.pickDataForCharacter(character, marvelCharacters);

        // Then
        expect(actual.test).toEqual('ok');
        expect(actual.pickType).toEqual('secretIdentity');
      });

      it('should match match a character even if the custom identity is not as precise as the aliase', () => {
        // Given
        let character = {
          infoboxData: {
            name: 'Aegis',
            aliases: [
              'Trey Jason Rollins'
            ]
          }
        };
        let marvelCharacters = {
          'Aegis (Trey Rollins)': {
            test: 'ok'
          }
        };

        // When
        let actual = Helper.pickDataForCharacter(character, marvelCharacters);

        // Then
        expect(actual.test).toEqual('ok');
        expect(actual.pickType).toEqual('secretIdentity');
      });
    });

    describe('realName', () => {
      it('should pick a character that has the name a secret identity', () => {
        // Given
        let character = {
          infoboxData: {
            name: "Eric O'Grady"
          }
        };
        let marvelCharacters = {
          "Ant-Man (Eric O'Grady)": {
            test: 'ok'
          }
        };

        // When
        let actual = Helper.pickDataForCharacter(character, marvelCharacters);

        // Then
        expect(actual.test).toEqual('ok');
        expect(actual.pickType).toEqual('realName');
      });
    });

    describe('looseMatch', () => {
      it(`should allow a loose match between the secret identity in the
         wiki name and the secret identity in the marvel name`, () => {
        // Given
        let character = {
          infoboxData: {
            name: 'Black Knight (Sir Percy)'
          }
        };
        let marvelCharacters = {
          'Black Knight (Sir Percy of Scandia)': {
            test: 'ok'
          }
        };

        // When
        let actual = Helper.pickDataForCharacter(character, marvelCharacters);

        // Then
        expect(actual.test).toEqual('ok');
        expect(actual.pickType).toEqual('looseMatch');
      });
    });

    describe('mainCharacterFallback', () => {
      it('should match the main character, without specific identity as a fallback', () => {
        // Given
        let character = {
          infoboxData: {
            name: 'Black Widow (Claire Voyant)'
          }
        };
        let marvelCharacters = {
          'Black Widow': {
            test: 'ok'
          }
        };

        // When
        let actual = Helper.pickDataForCharacter(character, marvelCharacters);

        // Then
        expect(actual.test).toEqual('ok');
        expect(actual.pickType).toEqual('mainCharacterFallback');
      });
    });
  });

  describe('getName', () => {
    it('should get the name from the infobox', () => {
      // Given
      let data = {
        infoboxData: {
          name: 'good'
        },
        dbpediaData: {
          name: 'bad'
        }
      };

      // When
      let actual = Helper.getName(data);

      // Then
      expect(actual).toEqual('good');
    });

    it('should get the name from the dbpedia if not in the infobox', () => {
      // Given
      let data = {
        infoboxData: {
          name: null
        },
        dbpediaData: {
          name: 'good'
        }
      };

      // When
      let actual = Helper.getName(data);

      // Then
      expect(actual).toEqual('good');
    });

    it('should use the Marvel API name if it is more precise', () => {
      // Given
      let data = {
        infoboxData: {
          name: "Eric O'Grady"
        },
        marvelApiData: {
          name: "Ant-Man (Eric O'Grady)",
          pickType: 'realName'
        }
      };

      // When
      let actual = Helper.getName(data);

      // Then
      expect(actual).toEqual("Ant-Man (Eric O'Grady)");
    });
  });

  describe('getSuperName', () => {
    it('should get the "in costume" name', () => {
      // Given
      sinon.stub(Helper, 'getName').returns('Ant-Man (Scott Lang)');
      let input = {};

      // When
      let actual = Helper.getSuperName(input);

      // Then
      expect(actual).toEqual('Ant-Man');
    });
  });

  describe('getDescription', () => {
    it('should get it from the Marvel API', () => {
      // Given
      let data = {
        marvelApiData: {
          description: 'good'
        },
        marvelWebsiteData: {
          description: 'bad'
        },
        infoboxData: {
          description: 'bad'
        },
        dbpediaData: {
          description: 'bad'
        }
      };

      // When
      let actual = Helper.getDescription(data);

      // Then
      expect(actual).toEqual('good');
    });

    it('should get it from the Marvel website if nothing in the API', () => {
      // Given
      let data = {
        marvelApiData: {
          description: null
        },
        marvelWebsiteData: {
          description: 'good'
        },
        infoboxData: {
          description: 'bad'
        },
        dbpediaData: {
          description: 'bad'
        }
      };

      // When
      let actual = Helper.getDescription(data);

      // Then
      expect(actual).toEqual('good');
    });

    it('should get it from the infobox if no desc in Marvel API/website', () => {
      // Given
      let data = {
        marvelApiData: {
          description: null
        },
        marvelWebsiteData: {
          description: null
        },
        infoboxData: {
          description: 'good'
        },
        dbpediaData: {
          description: 'bad'
        }
      };

      // When
      let actual = Helper.getDescription(data);

      // Then
      expect(actual).toEqual('good');
    });

    it('should get it from the dbpedia if no desc in Marvel API, Marvel website nor infobox', () => {
      // Given
      let data = {
        marvelApiData: {
          description: null
        },
        marvelWebsiteData: {
          description: null
        },
        infoboxData: {
          description: null
        },
        dbpediaData: {
          description: 'good'
        }
      };

      // When
      let actual = Helper.getDescription(data);

      // Then
      expect(actual).toEqual('good');
    });

    it('should return null if not found anywhere', () => {
      // Given
      let data = {
        marvelApiData: {
          description: null
        },
        marvelWebsiteData: {
          description: null
        },
        infoboxData: {
          description: null
        },
        dbpediaData: {
          description: null
        }
      };

      // When
      let actual = Helper.getDescription(data);

      // Then
      expect(actual).toEqual(null);
    });

    describe('mainCharacterFallback', () => {
      it('should not get it from the Marvel API/Website if they target a more generic character', () => {
        // Given
        let data = {
          marvelApiData: {
            description: 'bad',
            pickType: 'mainCharacterFallback'
          },
          marvelWebsiteData: {
            description: 'bad',
            pickType: 'mainCharacterFallback'
          },
          infoboxData: {
            description: 'good'
          },
          dbpediaData: {
            description: 'bad'
          }
        };

        // When
        let actual = Helper.getDescription(data);

        // Then
        expect(actual).toEqual('good');
      });

      it('should use the Marvel API description only if no other desc in the wiki', () => {
        // Given
        let data = {
          marvelApiData: {
            description: 'good',
            pickType: 'mainCharacterFallback'
          },
          infoboxData: {
            description: 'bad',
            pickType: 'mainCharacterFallback'
          },
          infoboxData: {
            description: null
          },
          dbpediaData: {
            description: null
          }
        };

        // When
        let actual = Helper.getDescription(data);

        // Then
        expect(actual).toEqual('good');
      });

      it('should use the Marvel website description only if no other desc in the wiki nor Marvel API', () => {
        // Given
        let data = {
          marvelApiData: {
            description: null
          },
          marvelWebsiteData: {
            description: 'good',
            pickType: 'mainCharacterFallback'
          },
          infoboxData: {
            description: null
          },
          dbpediaData: {
            description: null
          }
        };

        // When
        let actual = Helper.getDescription(data);

        // Then
        expect(actual).toEqual('good');
      });
    });
  });

  describe('getThumbnail', () => {
    it('should take it from marvel website first', () => {
      // Given
      let input = {
        marvelWebsiteData: {
          thumbnail: 'good'
        },
        marvelApiData: {
          image: 'bad'
        },
        imageData: {
          url: 'bad'
        }
      };

      // When
      let actual = Helper.getThumbnail(input);

      // Then
      expect(actual).toEqual('good');
    });

    describe('mainCharacterFallback', () => {
      it('should not get it from the Marvel website if the Marvel website is too generic', () => {
        // Given
        let data = {
          marvelWebsiteData: {
            thumbnail: 'bad',
            pickType: 'mainCharacterFallback'
          },
          marvelApiData: {
            image: 'good'
          },
          imageData: {
            url: 'bad'
          }
        };

        // When
        let actual = Helper.getThumbnail(data);

        // Then
        expect(actual).toEqual('good');
      });

      it('should not get it from the marvel API if the marvel API is too generic', () => {
        // Given
        let data = {
          marvelWebsiteData: {
            thumbnail: null
          },
          marvelApiData: {
            image: 'bad',
            pickType: 'mainCharacterFallback'
          },
          imageData: {
            url: 'good'
          }
        };

        // When
        let actual = Helper.getThumbnail(data);

        // Then
        expect(actual).toEqual('good');
      });

      it('should fallback to the website thumbnail if no wiki image', () => {
        // Given
        let data = {
          marvelWebsiteData: {
            thumbnail: 'good',
            pickType: 'mainCharacterFallback'
          },
          marvelApiData: {
            image: 'bad',
            pickType: 'mainCharacterFallback'
          },
          imageData: {
            url: null
          }
        };

        // When
        let actual = Helper.getThumbnail(data);

        // Then
        expect(actual).toEqual('good');
      });

      it('should fallback to the API image if no wiki image, and no generic image in the website', () => {
        // Given
        let data = {
          marvelWebsiteData: {
            thumbnail: null
          },
          marvelApiData: {
            image: 'good',
            pickType: 'mainCharacterFallback'
          },
          imageData: {
            url: null
          }
        };

        // When
        let actual = Helper.getThumbnail(data);

        // Then
        expect(actual).toEqual('good');
      });
    });

    it('should fallback to marvel API image if no website thumbnail', () => {
      // Given
      let input = {
        marvelWebsiteData: {
          thumbnail: null
        },
        marvelApiData: {
          image: 'good'
        },
        imageData: {
          url: 'bad'
        }
      };

      // When
      let actual = Helper.getThumbnail(input);

      // Then
      expect(actual).toEqual('good');
    });

    it('should fallback to imageData if no marvel thumbnail', () => {
      // Given
      let input = {
        marvelWebsiteData: {
          thumbnail: null
        },
        marvelApiData: {
          image: null
        },
        imageData: {
          url: 'good'
        }
      };

      // When
      let actual = Helper.getThumbnail(input);

      // Then
      expect(actual).toEqual('good');
    });

    it('should return null if no available thumbnail', () => {
      // Given
      let input = {};

      // When
      let actual = Helper.getThumbnail(input);

      // Then
      expect(actual).toEqual(null);
    });
  });

  describe('getBackgroundImage', () => {
    it('should get the background image from marvelWebsite', () => {
      // Given
      let input = {
        marvelWebsiteData: {
          featuredBackground: 'good'
        }
      };

      // When
      let actual = Helper.getBackgroundImage(input);

      // Then
      expect(actual).toEqual('good');
    });

    it('should return null if no background image', () => {
      // Given
      let input = {};

      // When
      let actual = Helper.getBackgroundImage(input);

      // Then
      expect(actual).toEqual(null);
    });
  });

  describe('getMainColor', () => {
    it('should get the color from the marvel website', () => {
      // Given
      let input = {
        marvelWebsiteData: {
          mainColor: 'good'
        }
      };

      // When
      let actual = Helper.getMainColor(input);

      // Then
      expect(actual).toEqual('good');
    });

    it('should return null if no such key', () => {
      // Given
      let input = {
        marvelWebsiteData: {}
      };

      // When
      let actual = Helper.getMainColor(input);

      // Then
      expect(actual).toEqual(null);
    });
  });

  describe('getUrls', () => {
    it('should get the wikipedia url', () => {
      // Given
      let input = {
        wikipediaUrl: 'good'
      };

      // When
      let actual = Helper.getUrls(input);

      // Then
      expect(actual.wikipedia).toEqual('good');
    });

    it('should use the Marvel website url if one is found', () => {
      // Given
      let input = {
        marvelWebsiteData: {
          url: 'good'
        },
        marvelApiData: {
          url: 'bad'
        }
      };

      // When
      let actual = Helper.getUrls(input);

      // Then
      expect(actual.marvel).toEqual('good');
    });

    it('should get the Marvel url from the Marvel API if no url in the website', () => {
      // Given
      let input = {
        marvelWebsiteData: {
          url: null
        },
        marvelApiData: {
          url: 'good'
        }
      };

      // When
      let actual = Helper.getUrls(input);

      // Then
      expect(actual.marvel).toEqual('good');
    });


    it('should have a null marvel URL if not defined', () => {
      // Given
      let input = {};

      // When
      let actual = Helper.getUrls(input);

      // Then
      expect(actual.marvel).toEqual(null);
    });
  });

  describe('getAliases', () => {
    it('should merge aliases from infobox, dbpedia and wikidata ', () => {
      // Given
      let input = {
        infoboxData: {
          aliases: [
            'foo'
          ]
        },
        dbpediaData: {
          aliases: [
            'bar'
          ]
        },
        wikidataData: {
          aliases: [
            'baz'
          ]
        }
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual).toInclude('foo');
      expect(actual).toInclude('bar');
      expect(actual).toInclude('baz');
    });

    it('should remove duplicates', () => {
      // Given
      let input = {
        infoboxData: {
          aliases: [
            'foo',
            'bar',
            'baz'
          ]
        },
        dbpediaData: {
          aliases: [
            'bar'
          ]
        },
        wikidataData: {
          aliases: [
            'baz'
          ]
        }
      };

      // When
      let actual = Helper.getAliases(input);

      // Then
      expect(actual.length).toEqual(3);
      expect(actual).toInclude('foo');
      expect(actual).toInclude('bar');
      expect(actual).toInclude('baz');
    });
  });

  describe('getAuthors', () => {
    it('should merge authors from infobox and dbpedia', () => {
      // Given
      let input = {
        infoboxData: {
          authors: [
            'foo'
          ]
        },
        dbpediaData: {
          authors: [
            'bar'
          ]
        }
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual).toInclude('foo');
      expect(actual).toInclude('bar');
    });

    it('should remove duplicates', () => {
      // Given
      let input = {
        infoboxData: {
          authors: [
            'foo',
            'bar',
            'baz'
          ]
        },
        dbpediaData: {
          authors: [
            'bar'
          ]
        }
      };

      // When
      let actual = Helper.getAuthors(input);

      // Then
      expect(actual.length).toEqual(3);
      expect(actual).toInclude('foo');
      expect(actual).toInclude('bar');
    });
  });

  describe('getTeams', () => {
    it('should merge teams from infobox and dbpedia', () => {
      // Given
      let input = {
        infoboxData: {
          teams: [
            'foo'
          ]
        },
        dbpediaData: {
          teams: [
            'bar'
          ]
        }
      };

      // When
      let actual = Helper.getTeams(input);

      // Then
      expect(actual).toInclude('foo');
      expect(actual).toInclude('bar');
    });

    it('should remove duplicates', () => {
      // Given
      let input = {
        infoboxData: {
          teams: [
            'foo',
            'bar',
            'baz'
          ]
        },
        dbpediaData: {
          teams: [
            'bar'
          ]
        }
      };

      // When
      let actual = Helper.getTeams(input);

      // Then
      expect(actual.length).toEqual(3);
      expect(actual).toInclude('foo');
      expect(actual).toInclude('bar');
    });
  });

  describe('getSecretIdentities', () => {
    it('should merge secret identities from infobox and dbpedia', () => {
      // Given
      let input = {
        infoboxData: {
          secretIdentities: [
            'foo'
          ]
        },
        dbpediaData: {
          secretIdentities: [
            'bar'
          ]
        }
      };

      // When
      let actual = Helper.getSecretIdentities(input);

      // Then
      expect(actual).toInclude('foo');
      expect(actual).toInclude('bar');
    });

    it('should remove duplicates', () => {
      // Given
      let input = {
        infoboxData: {
          secretIdentities: [
            'foo',
            'bar',
            'baz'
          ]
        },
        dbpediaData: {
          secretIdentities: [
            'bar'
          ]
        }
      };

      // When
      let actual = Helper.getSecretIdentities(input);

      // Then
      expect(actual.length).toEqual(3);
      expect(actual).toInclude('foo');
      expect(actual).toInclude('bar');
    });
  });

  describe('getSpecies', () => {
    it('should merge species from infobox and dbpedia', () => {
      // Given
      let input = {
        infoboxData: {
          species: [
            'foo'
          ]
        },
        dbpediaData: {
          species: [
            'bar'
          ]
        }
      };

      // When
      let actual = Helper.getSpecies(input);

      // Then
      expect(actual).toInclude('foo');
      expect(actual).toInclude('bar');
    });

    it('should remove duplicates', () => {
      // Given
      let input = {
        infoboxData: {
          species: [
            'foo',
            'bar',
            'baz'
          ]
        },
        dbpediaData: {
          species: [
            'bar'
          ]
        }
      };

      // When
      let actual = Helper.getSpecies(input);

      // Then
      expect(actual.length).toEqual(3);
      expect(actual).toInclude('foo');
      expect(actual).toInclude('bar');
    });
  });

  describe('getPartners', () => {
    it('should merge partners from infobox and dbpedia', () => {
      // Given
      let input = {
        infoboxData: {
          partners: [
            'foo'
          ]
        },
        dbpediaData: {
          partners: [
            'bar'
          ]
        }
      };

      // When
      let actual = Helper.getPartners(input);

      // Then
      expect(actual).toInclude('foo');
      expect(actual).toInclude('bar');
    });

    it('should remove duplicates', () => {
      // Given
      let input = {
        infoboxData: {
          partners: [
            'foo',
            'bar',
            'baz'
          ]
        },
        dbpediaData: {
          partners: [
            'bar'
          ]
        }
      };

      // When
      let actual = Helper.getPartners(input);

      // Then
      expect(actual.length).toEqual(3);
      expect(actual).toInclude('foo');
      expect(actual).toInclude('bar');
    });
  });

  describe('getPowers', () => {
    it('should remove duplicate value without case sensitivity', () => {
      // Given
      let input = {
        dbpediaData: {
          powers: [
            'Teleportation'
          ]
        },
        infoboxData: {
          powers: [
            'teleportation'
          ]
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual.length).toEqual(1);
    });

    it('should capitalize the powers', () => {
      // Given
      let input = {
        dbpediaData: {
          powers: [
            'Teleportation'
          ]
        },
        infoboxData: {
          powers: [
            'durability'
          ]
        }
      };

      // When
      let actual = Helper.getPowers(input);

      // Then
      expect(actual).toEqual(['Teleportation', 'Durability']);
    });
  });

  describe('getRanking', () => {
    it('should get the various comics/events/stories/series count', () => {
      // Given
      let input = {
        marvelApiData: {
          counts: {
            comics: 1,
            events: 2,
            stories: 3,
            series: 4
          }
        }
      };

      // When
      let actual = Helper.getRanking(input);

      // Then
      expect(actual.comicCount).toEqual(1);
      expect(actual.eventCount).toEqual(2);
      expect(actual.storyCount).toEqual(3);
      expect(actual.serieCount).toEqual(4);
    });

    it('should have the pageview count', () => {
      // Given
      let input = {
        pageviews: {
          latest90: 1
        }
      };

      // When
      let actual = Helper.getRanking(input);

      // Then
      expect(actual.pageviewCount).toEqual(1);
    });
  });
});
