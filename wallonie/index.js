const csv = require('csvtojson');
const axios = require('axios').default;
const fs = require('fs');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

async function getData() {
    const data = await csv({delimiter: ';'}).fromFile('./deputes-wallons-08-09-2020.csv');

    console.log(data);

    const result = [];

    for (let mpInput of data) {
        try {
            const mp = {};

            mp.parliament = 'Wallon';
            mp.firstName = mpInput.firstName;
            mp.lastName = capitalizeFirstLetter(mpInput.lastName);
            mp.city = capitalizeFirstLetter(mpInput.city);
            mp.party = mpInput.party;
            mp.id = mpInput.id;
            mp.constituency = capitalizeFirstLetter(mpInput.constituency);
            mp.language = 'Frans',
            mp.email = mpInput.email;
            mp.twitter = mpInput.twitter && '@' + mpInput.twitter.replace('https://twitter.com/', '').replace('@', '');
            
            if (mpInput.picture) {
                try {
                    mp.localImg = mp.id + '.jpg';
                    const path = 'img/' + mp.localImg;
                    //await downloadImage(mpInput.picture, path);
                } catch (err) {
                    console.error('Error downloading image', err);
                    mp.localImg = 'anonymous.jpg';
                }
            } else {
                mp.localImg = 'anonymous.jpg';
            }
            
            result.push(mp);

            console.log('Processed: ', mp.lastName, mp.firstName, mp.constituency);
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