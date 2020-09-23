const memberCodes = require('./members');
const axios = require('axios').default;
const fs = require('fs');

async function getData() {
    const result = [];

    for (let code of memberCodes) {
        try {
            const mp = {};
            mp.id = code;

            const page = await axios.get(`http://www.parlement.brussels/meps/${code}/?lang=nl`);
            const profile = page.data;
            const nameRegex = /(?<=name high">)(.*)(?=<)/g;
            const nameMatches = profile.match(nameRegex);
            const name = nameMatches[0];
            
            const geboorteStadRegex = /(?<= te )(.*)(?=\<\/td)/g;
            const geboorteStadMatches = profile.match(geboorteStadRegex);
            let geboorteStad;
            if (geboorteStadMatches && geboorteStadMatches.length > 0) geboorteStad = geboorteStadMatches[0];
            
            const emailRegex = /(?<=href\=\"mailto\:)(.*)(?=\")/g;
            const emailMatches = profile.match(emailRegex);
            let email;
            if (emailMatches && emailMatches.length > 0) email = emailMatches[0];
            
            const pictureRegex = /(?<=profile_pics\/)(.*)(?=\))/g;
            const pictureMatches = profile.match(pictureRegex);
            let picture;
            if (pictureMatches && pictureMatches.length > 0) picture = pictureMatches[0];
            
            const partyLogoRegex = /(?<=logo\" style=\"background-image\:url\(\')(.*)(?=\'\)\;)/g;
            const partyLogoMatches = profile.match(partyLogoRegex);
            let partyLogo;
            if (partyLogoMatches && partyLogoMatches.length > 0) partyLogo = partyLogoMatches[0];

            mp.firstName = name.slice(0, name.indexOf(' '));
            mp.lastName = name.slice(name.lastIndexOf(' '), name.length);

            mp.parliament = 'Brussel'
            mp.constituency = 'Brussel-Hoofdstad';

            mp.hometown = geboorteStad;
            mp.email = email;

            mp.partyLogo = partyLogo;
            
            if (picture) {
                try {
                    mp.localImg = picture;
                    const path = 'img/' + mp.localImg;
                    await downloadImage('http://www.parlement.brussels/prb_includes/profile_pics/' + picture, path);
                } catch (err) {
                    console.error('Error downloading image', err);
                    mp.localImg = 'anonymous.jpg';
                }
            } else {
                mp.localImg = 'anonymous.jpg';
            }
            
            result.push(mp);

            console.log('Processed: ', mp.firstName, mp.lastName);
        } catch (error) {
            console.error(error);
        }
    }

    console.log('Finished; saving...');

    fs.writeFileSync('enriched.json', JSON.stringify(result));

    console.log('Done');
}

async function downloadImage (url, path) {  
    console.log(url, path);

  const writer = fs.createWriteStream(path);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  });
}

getData();