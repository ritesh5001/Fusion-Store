const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },

    description: {
        type: String,
        required: false
    },

    price:{
        amount:{ type:Number, required:true },
        currency:{ type:String, enum:['USD','INR'], default:'INR' }
    },

    seller:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    images:[{
        url:String,
        thumbnail:String,
        id:String
    }]

})

// Text index for search queries (used by GET /api/products with ?q=)
productSchema.index({ title: 'text', description: 'text' });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = Product;