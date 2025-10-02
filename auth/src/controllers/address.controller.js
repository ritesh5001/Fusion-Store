const mongoose = require('mongoose');
const userModel = require('../models/user.model');

// Get addresses for current user
async function getUserAddresses(req, res) {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const addresses = user.address || [];
    return res.status(200).json({ addresses });
  } catch (err) {
    console.error('getUserAddresses error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Add address for current user
async function addUserAddresses(req, res) {
  try {
    const userId = req.user.id;
  const { street, city, state, country, pincode, isDefault } = req.body;

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If the new address isDefault, unset previous default
    if (isDefault) {
      user.address.forEach(a => { a.isDefault = false; });
    }

    // If this is the first address, default to isDefault true unless explicitly false
    const willBeDefault = isDefault === true || user.address.length === 0;

    const address = { street, city, state, country, pincode, isDefault: willBeDefault };

    user.address.push(address);
    await user.save();

    const created = user.address[user.address.length - 1];
    return res.status(201).json({ message: 'Address added', address: created });
  } catch (err) {
    console.error('addUserAddresses error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete address for current user
async function deleteUserAddress(req, res) {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const idx = user.address.findIndex(a => String(a._id) === String(addressId));
    if (idx === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }

    user.address.splice(idx, 1);
    await user.save();

    return res.status(200).json({ message: 'Address removed' });
  } catch (err) {
    console.error('deleteUserAddress error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getUserAddresses,
  addUserAddresses,
  deleteUserAddress,
};
