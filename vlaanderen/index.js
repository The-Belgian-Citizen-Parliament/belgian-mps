const csv = require('csvtojson');
const axios = require('axios').default;
const fs = require('fs');

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function getData() {
    const data = await csv({delimiter: ';'}).fromFile('./vlaams_parlement.csv');

    console.log(data);

    const result = [];

    for (let mpInput of data) {
        try {
            const mp = {};

            mp.parliament = 'Vlaams Parlement';
            mp.firstName = mpInput.voornaam;
            mp.lastName = mpInput.naam;
            mp.city = mpInput.gemeente;
            mp.party = mpInput.fractie;
            mp.id = mpInput.id;
            mp.constituency = capitalizeFirstLetter(mpInput.kieskring.replace('Kieskring ', ''));
            mp.language = 'Nederlands',
            mp.email = mpInput.email;
            
            if (mpInput.fotowebpath) {
                try {
                    mp.localImg = mp.id + '.jpg';
                    const path = 'img/' + mp.localImg;
                    await downloadImage(mpInput.fotowebpath, path);
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