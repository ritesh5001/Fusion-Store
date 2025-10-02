const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    zip: { type: String }, // legacy
    pincode: { type: String },
    isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String,
        select:false,
    },
    fullName: {
        firstName: {
            type: String,
            require: true
        },
        lastName: {
            type: String,
            required: true
        }
    },
    role: {
        type: String,
        enum: ['user', 'seller'],
        default: 'user'
    },
    address: [
        addressSchema
    ]
})

const userModel = mongoose.model('user',userSchema);

module.exports = userModel;