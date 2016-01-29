import fs from 'fs';
import cloudinary from 'cloudinary';
import glob from 'glob';
import jsonfile from 'jsonfile';

// We get all files, to get all the record
const recordsPath = './records/';
let cloudName = 'pixelastic-marvel';

// Checks the apiKey in ENV and local file
let apiKey = process.env.CLOUDINARY_API_KEY;
if (fs.existsSync('./_cloudinary_api_key')) {
  apiKey = fs.readFileSync('./_cloudinary_api_key', 'utf8').trim();
}
let apiSecret = process.env.CLOUDINARY_API_SECRET;
if (fs.existsSync('./_cloudinary_api_secret')) {
  apiSecret = fs.readFileSync('./_cloudinary_api_secret', 'utf8').trim();
}
if (!apiKey || !apiSecret) {
  console.info('Usage:');
  console.info('$ CLOUDINARY_API_KEY=XXX CLOUDINARY_API_SECRET=YYY npm run cloudinary');
  process.exit();
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});


glob(`${recordsPath}/*.json`, (errGlob, recordFiles) => {
  if (errGlob) {
    console.info('Error in globbing', errGlob);
    return;
  }

  // Get the list of all records
  let records = [];
  recordFiles.forEach((recordFile) => {
    const record = jsonfile.readFileSync(recordFile);
    records.push(record.image);
  });
  console.info(records[42]);

  // getAllUnusedImages(records);
});

function getAllUnusedImages(records) {
  // TODO: We browse the whole list. If an image returned by the API is not in
  // our list, we keep a reference to it.
  // Then, we call a deleteAllUnusedImages(blacklist)
  let options = {
    // type: 'upload'
  }

  function onResults(results) {
    console.info(results);
  }

  cloudinary.api.resources(onResults, options);
}
