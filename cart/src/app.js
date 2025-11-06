const express = require('express');
const cartRoutes = require('./routes/cartRoutes');
const errorHandler = require('./middleware/errorHandler');
const cartRoutes = require('./routes/cart.routes');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/api/cart', cartRoutes);

app.use(errorHandler);

module.exports = app;