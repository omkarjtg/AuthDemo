const express = require('express');
const mongoose = require('mongoose');
const app = express();
const path = require('path');
const ejsMate = require('ejs-mate');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const session = require('express-session');
const flash = require('express-flash');


async function connectToDatabase() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/AuthDemo');
        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
};
mongoose.connection.on('error', (error) => {
});
connectToDatabase();

app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(session(
    {
        secret: 'topsecret',
        resave: false,
        saveUninitialized: false

    }));
app.use(flash());

const requireLogin = async (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    next();
}
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { password, username } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const user = new User({
        username,
        password: hash
    });
    await user.save();
    req.session.user_id = user._id;
    res.redirect('/');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { password, username } = req.body;
  const foundUser = await User.findAndValidate(username, password);

  if (foundUser) {
    req.session.user_id = foundUser._id;
    res.redirect('/secret');
  } else {
    req.flash('error', 'Wrong username or password');
    res.redirect('/login');
  }
});

app.post('/logout', (req, res) => {
    // req.session.user_id = null;
    req.session.destroy();
    res.redirect('/');
});
app.get('/secret', requireLogin, async (req, res) => {
    const { id } = req.session.user_id;
    const user = await User.findOne({ id });
    res.render('secret', { user });

});
app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

