const express = require('express');
const cartRoutes = require('./routes/cartRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

app.use('/cart', cartRoutes);

app.use(errorHandler);

module.exports = app;