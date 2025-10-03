const ImageKit = require('imagekit');
const { v4: uuidv4} = require('uuid');

const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL } = process.env;

const imagekit = new ImageKit({
  publicKey: IMAGEKIT_PUBLIC_KEY,
  privateKey: IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: IMAGEKIT_URL
});

async function uploadImages({buffer, fileName,folder='/products'}){
    const res = await imagekit.upload({
        file: buffer,
        fileName: uuidv4(),
        folder
    });
    return {
        url: res.url,
        thumbnail: res.thumbnailUrl || res.url,
        id: res.fileId,
    };
}

module.exports = imagekit;
