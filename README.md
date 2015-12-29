# Marvel

This is the list of all Marvel superheroes and supervillains, in JSON format,
along with the scripts used to generate it.

All the informations are from the Wikipedia.

## Run locally

If you want to run the scripts yourself to regenerate all the content:

```sh
# Install dependencies
npm install
# Get the list of all urls
npm run step1
# Grab the infobox from all the previous urls
npm run step2
# Extract only relevant info from the infoboxes
npm run step3
# Add image url and dimensions
npm run step4
# Add pageviews counts
npm run step5
```

All intermediate files are stored in `./download`

## TODO

- Remove duplicates due to redirects (Red Skull)
- Get real name for heroes (cf Spider-man Noir) (Use url name?)
- Facet sidebar

