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
  try {
    // Basic field extraction; detailed validation for price happens in parsePrice
    const { title, description } = req.body;

    // Parse price from body (supports JSON string or object)
    let price;
    try {
      price = parsePrice(req.body);
    } catch (err) {
      // Known validation errors should return 400 matching tests' expectations
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // Determine seller: from body (tests pass it) or from auth middleware if present
    const seller = req.body.seller || req.user?.id;

    // Upload images if provided
    let images = [];
    if (req.files && req.files.length > 0) {
      images = await uploadImages(req.files);
    }

    // Create the product
    const product = new Product({
      title,
      description,
      price,
      seller,
      images
    });

    await product.save();

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
}


module.exports = {
  createProduct
};
