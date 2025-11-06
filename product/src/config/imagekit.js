const ImageKit = require('imagekit');
const { v4: uuidv4} = require('uuid');

const normalize = (v) => (typeof v === 'string' ? v.trim().replace(/^['"]|['"]$/g, '') : v);
const { IMAGEKIT_PUBLIC_KEY: RAW_PUB, IMAGEKIT_PRIVATE_KEY: RAW_PRIV, IMAGEKIT_URL: RAW_URL, IMAGEKIT_URL_ENDPOINT: RAW_URL_EP } = process.env;

const IMAGEKIT_PUBLIC_KEY = normalize(RAW_PUB);
const IMAGEKIT_PRIVATE_KEY = normalize(RAW_PRIV);
const IMAGEKIT_URL = normalize(RAW_URL);
const IMAGEKIT_URL_ENDPOINT = normalize(RAW_URL_EP);

const urlEndpoint = IMAGEKIT_URL || IMAGEKIT_URL_ENDPOINT;

// Guard against missing configuration to provide a clearer error
if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !urlEndpoint) {
        const missing = [];
        if (!IMAGEKIT_PUBLIC_KEY) missing.push('IMAGEKIT_PUBLIC_KEY');
        if (!IMAGEKIT_PRIVATE_KEY) missing.push('IMAGEKIT_PRIVATE_KEY');
        if (!urlEndpoint) missing.push('IMAGEKIT_URL or IMAGEKIT_URL_ENDPOINT');

    console.error('ImageKit env diagnostics:', {
        hasPublic: !!IMAGEKIT_PUBLIC_KEY,
        hasPrivate: !!IMAGEKIT_PRIVATE_KEY,
        hasUrl: !!IMAGEKIT_URL,
        hasUrlEndpoint: !!IMAGEKIT_URL_ENDPOINT
    });
    throw new Error(`ImageKit config missing: ${missing.join(', ')}. Check your .env variable names.`);
}

const imagekit = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    privateKey: IMAGEKIT_PRIVATE_KEY,
    urlEndpoint
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
