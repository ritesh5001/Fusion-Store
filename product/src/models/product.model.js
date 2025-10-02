const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },

    price:{
        amount:{ type:Number, required:true },
        currency:{ type:String, required:true }
    },

})