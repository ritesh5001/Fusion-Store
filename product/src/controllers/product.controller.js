const Product = require('../models/product.model');
const imagekit = require('../config/imagekit');
const upload = require('../middlewares/upload');

function parsePrice(body) {
  if (body.price) {
    if (typeof body.price === 'string') {
      try {
        const parsed = JSON.parse(body.price);
        return {
          amount: Number(parsed.amount),
          currency: parsed.currency || 'INR'
        };
      } catch (error) {
        throw new Error('Invalid price format. Expected JSON string.');
      }
    }

    if (typeof body.price === 'object') {
      return {
        amount: Number(body.price.amount),
        currency: body.price.currency || 'INR'
      };
    }
  }

  if (body.priceAmount !== undefined) {
    return {
      amount: Number(body.priceAmount),
      currency: body.priceCurrency || 'INR'
    };
  }

  throw new Error('Price information is required.');
}

async function uploadImages(files = []) {
  if (!files.length) {
    return [];
  }

  const uploads = await Promise.all(
    files.map((file) =>
      imagekit.upload({
        file: file.buffer,
        fileName: file.originalname,
        folder: 'products'
      })
    )
  );

  return uploads.map((result) => ({
    url: result.url,
    thumbnail: result.thumbnailUrl || result.thumbnail,
    id: result.fileId || result.id
  }));
}

async function createProduct(req, res) {
    const {title, description, priceAmount, priceCurrency='INR'} = req.body;
    if (!title || !priceAmount) {
        return res.status(400).json({ message: 'Title and priceAmount are required fields.' });
    }
    
    const seller = req.user.id;

    const price = {
        amount: Number(priceAmount),
        currency: priceCurrency
    }

    const images = [];
    const files = await Promise.all((req.files || []).map(file => uploadImages({buffer:file.buffer})));
}


module.exports = {
  createProduct
};
