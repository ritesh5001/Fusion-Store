const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const redis = require('../db/redis');

async function registerUser(req, res) {

    try {

        const { username, email, password } = req.body;
        const firstName = req.body?.fullName?.firstName ?? req.body.firstName;
        const lastName = req.body?.fullName?.lastName ?? req.body.lastName;
        const role = req.body?.role ?? 'user';

        const isUserAlreadyExists = await userModel.findOne({
            $or: [
                { username },
                { email }
            ]
        });

        if (isUserAlreadyExists) {
            return res.status(409).json({
                message: "Username or email already exists"
            })
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email,
            password: hash,
            fullName: { firstName, lastName },
            role: role || 'user'
        })

        const token = jwt.sign({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: '1d' })

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
        })

        res.status(201).json({
            message: "user registered successfully",
            id: user._id,
            username: user.username,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                address: user.address
            }
        })
    }

    catch (err) {
        console.log("Error in register User", err);

        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'validation error', errors: err.errors });
        }
        res.status(500).json({ message: "internal server error" });
    }


}

async function loginUser(req, res) {
    try {
        const { username, email, password } = req.body;

        const user = await userModel
            .findOne({ $or: [{ email }, { username }] })
            .select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password || "");
        if (!isMatch) {
            return res.status(401).json({
                message: 'invalid credentials'
            })
        }

        const token = jwt.sign({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,

        });

        return res.status(200).json({
            message: 'Logged in Succesfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                address: user.address
            }
        });
    }
    catch (err) {
        console.log('Error in loginUser:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}



async function getCurrentUser(req, res) {
    try {
        return res.status(200).json({
            message: "Current user fetched successfully",
            user: req.user,
        });
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function logoutUser(req, res) {
    try {
        const token = req.cookies.token;
        if (token) {
            await redis.set(`blacklist:${token}`, 'true', 'EX', 24 * 60 * 60) // Set token in redis with 1 day expiry
        }
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.log('Error in logoutUser:', err);
        // Even if Redis fails, we should still clear the cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });
        return res.status(200).json({ message: 'Logged out successfully' });
    }
}

async function getUserAddresses(req, res) {

    const id = req.user.id;

    const user = await userModel.findById(id).select('address');

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({
        message: 'User addresses fetched successfully',
        addresses: user.address
    })
}

async function addUserAddress(req, res) {
    const id = req.user.id;

    const { street, city, state, country, pincode, isDefault } = req.body;

    const user = await userModel.findOneAndUpdate({ _id: id }, {
        $push: {
            address: { street, city, state, country, pincode, isDefault }
        }
    }, { new: true });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    return res.status(201).json({
        message: 'Address added successfully',
        address: user.address[user.address.length - 1]
    })
}

async function deleteUserAddress(req, res) {
    const userId = req.user.id;
    const { addressId } = req.params;

    const isAddressExists = await userModel.findOne({
        _id: id,
        'address._id': addressId
    });

    if (!isAddressExists) {
        return res.status(404).json({ message: 'Address not found' });
    }

    const user = await userModel.findOneAndUpdate({ _id: userId }, {
        $pull: {
            address: { _id: addressId }
        }
    }, { new: true });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const addressExists = user.address.some(a => String(a._id) === String(addressId));
    if (addressExists) {
        return res.status(500).json({ message: 'Failed to delete address' });
    }

    return res.status(200).json({
        message: 'Address deleted successfully',
        addresses: user.address
    })

}

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    getUserAddresses,
    addUserAddress,
    deleteUserAddress
}