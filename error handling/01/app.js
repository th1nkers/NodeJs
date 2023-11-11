// Importing required modules
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const csrf = require('csurf');
const flash = require('connect-flash');

// Importing controllers and models
const errorController = require('./controllers/error');
const User = require('./models/user');

// MongoDB connection URI
const MONGODB_URI = 'mongodb+srv://th1nkers:dsGFVZpKtU1xU0gK@cluster0.rf7ldel.mongodb.net/shop';

// Creating Express app
const app = express();

// Creating a MongoDB session store
const store = MongoStore.create({
  mongoUrl: MONGODB_URI,
  collection: 'sessions'
});

// Setting up CSRF protection
const csrfProtection = csrf();

// Configuring the Express app
app.set('view engine', 'ejs');
app.set('views', 'views');

// Importing route handlers
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// Middleware for parsing request body
app.use(bodyParser.urlencoded({ extended: false }));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Configuring session management
app.use(
  session({
    secret: 'th1nkers',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

// Adding CSRF protection to the app
app.use(csrfProtection);

// Adding flash messages support
app.use(flash());

// Middleware for setting local variables
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Middleware for checking and setting user information
app.use((req, res, next) => {
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
});

// Routing configuration
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// Error handling routes
app.get('/500', errorController.get500);
app.use(errorController.get404);

// Global error handling middleware
app.use((error, req, res, next) => {
  res.redirect('/500');
});

// Connecting to MongoDB and starting the server
mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
