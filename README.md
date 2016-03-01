# Marvel

This repository holds the list of all the Marvel superheroes and supervillains,
in JSON format. It also contains the set of scripts used to get them (by
scrapping various APIs and websites), as well as UI to allow searching through
them.

## Run the demo

## Regenerate the date

Everything is done through `npm run` scripts. Start with an `npm install`, and
then run an `npm run init`. This will download the list of all the Marvel
characters available on the Wikipedia and save them in `./download/urls`.

`npm run wikidata` will query the Wikidata API to get metadata of the various
Wikipedia pages. Wikidata data essentially include metadata about the Wikipedia
page itself, and not about the content of it. This is not the best source of
data, we actually do not use it much. All the Wikidata information is saved in
`./download/wikidata`.

`npm run dbpedia` will get information about our pages from the DBPedia project.
The DBPedia is an unofficial API for the Wikipedia. It contains much more data
than the Wikidata, including the actual content of the right infobox as well as
all the page redirects. All DBPedia data is saved in `./download/dbpedia`.

`npm run infobox` will get data from the infoboxes (box on the right of each
Wikipedia page). This should get the same data than `npm run dbpedia` but this
one will be more fresh (the DBPedia is only a dump at a specific date). The
downside is that the data is harder to parse and results are sometimes not that
great. We take data from both sources and merge them, to be sure we have the
best of both worlds.

`npm run images` will crawl all the Wikipedia pages to get the url of the
character image. This data is not available in the DBPedia dump. The complete
list of images is stored in `./download/images/images.json`.

`npm run pageviews` will crawl the [http://stats.grok.se](http://stats.grok.se)
API to get visits stats on the last 90 days of all the urls in the original
list. The website is quite slow, so this command can take a long time to
execute. Also, it does not currently handles multiples urls redirecting to the
same place, so only the most popular will be taken into account. Pageviews data
is stored in `./download/pageviews`.

`npm run marvel` will try to find on the official Marvel API all the characters
we extracted from the Wikipedia. The Marvel API can be unreliable (ie. down or
slow) sometimes, so it includes its own "_try again until it works_" mechanism.
The API requires a set of API keys to be used. Those can be passed either as
environment variables (`MARVEL_API_KEY` and `MARVEL_API_KEY_PRIVATE`) or as
files in the root directory (`_marvel_api_key` and `_marvel_api_key_private`).
The Marvel API gives us access to a nice description as well as a nice picture
(we only use the one from the Wikipedia as fallback). This data is stored in
`./download/marvel`.

You can also run `npm run download:all` to download from all the sources in
sequence.

`npm run consolidate` actually grabs data from all the previous downloaded json
files and build a curated list of records saved in `./records`. Then `npm run
push` will push all those records to the Algolia index (and configure it
properly).

## Tests

Getting data from various sources and cleaning them is an error-prone process.
You can easily break something when fixing something else. That's why this
project has so many tests. You can run them all with `npm run test` and start
a TDD-ready live watching with `npm run test:watch`.

`npm run lint` also take care of the styleguide.

## Front-end

The front-end code uses Brunch. It has everything a front-end build tool should
have, including live reload and SCSS/Babel compiling. Just run `npm run serve`
to start the server on [http://localhost:5006/](http://localhost:5006/). You can
also manually run `npm run build` to populate the `./public` directory with all
the built website.

Following Brunch conventions:

- `./app/*.js` files will be compiled through Babel
- `./app/styles/*.scss` files will be compiled to CSS
- `./app/assets/*` files will be copied without modifications to `./public`

## TODO

- Allow click on facets to filter faceting
- Add "Show all" to facets?
- Show the team/power/specy/author that matches
- Clic sur une facet directement dans les cards

