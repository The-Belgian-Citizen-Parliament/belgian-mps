const data = require('./kamer_clean');
const axios = require('axios').default;
const fs = require('fs');

async function getData() {
    const result = [];

    for (let mp of data) {
        try {
            const page = await axios.get(mp.profile);
            const profile = page.data;
            
            const kieskringRegex = /(?<=voor de kieskring )(.*)/g;
            const kieskringMatches = profile.match(kieskringRegex);
            let kieskring;
            if (kieskringMatches && kieskringMatches.length > 0) {
                if (kieskringMatches[0].indexOf('.') > 0) {
                    kieskring = kieskringMatches[0].substring(0, kieskringMatches[0].indexOf('.'));
                }
                if (kieskringMatches[0].indexOf(' sedert') > 0) {
                    kieskring = kieskringMatches[0].substring(0, kieskringMatches[0].indexOf(' sedert'));
                }
            }
            
            const geboorteStadRegex = /(?<=Geboren te )(.*)(?= op )/g;
            const geboorteStadMatches = profile.match(geboorteStadRegex);
            let geboorteStad;
            if (geboorteStadMatches && geboorteStadMatches.length > 0) geboorteStad = geboorteStadMatches[0];
            
            const taalRegex = /(?<=Taal:\<\/i\> )(.*)(?= )/g;
            const taalMatches = profile.match(taalRegex);
            let taal;
            if (taalMatches && taalMatches.length > 0) taal = taalMatches[0];

            mp.constituency = kieskring;
            mp.hometown = geboorteStad;
            mp.language = taal;

            let img;
            let imgExt = '.jpg';
            try {
                img = await axios.get(mp.image);
            } catch (ex) {
                console.log('Trying gif');
                mp.image = mp.image.replace('.jpg', '.gif');
                imgExt = '.gif';
                try {
                    img = await axios.get(mp.image);
                } catch (ex) {
                    console.log('Trying ksegna_55');
                    mp.image = mp.image.replace('/cv/', '/cv/ksegna_55/').replace('.gif', '.jpg');
                    imgExt = '.jpg';
                    try {
                        img = await axios.get(mp.image);
                    } catch (ex) {
                        console.log('Trying removing 0');
                        mp.image = mp.image.replace('00', '').replace('0', '').replace('.jpg', '.gif');
                        imgExt = '.gif';
                        try {
                            img = await axios.get(mp.image);
                        } catch (ex) {
                            console.log('Could not determine img for ', mp.id, mp.name);
                        }
                    }
                }
            }
            
            if (img && img.data) {
                try {
                    mp.localImg = mp.id + imgExt;
                    const path = 'img/' + mp.localImg;
                    await downloadImage(mp.image, path);
                } catch (err) {
                    console.error('Error downloading image', err);
                    mp.localImg = 'anonymous.jpg';
                }
            } else {
                mp.localImg = 'anonymous.jpg';
            }

            mp.firstName = mp.name.split(' ').pop();
            mp.lastName = mp.name.slice(0, mp.name.lastIndexOf(' '));
            delete mp.name;
            delete mp.image;
            delete mp.profile;
            
            result.push(mp);

            console.log('Processed: ', mp.constituency, mp.hometown, mp.language);
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