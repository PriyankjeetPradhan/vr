if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}



const express = require('express');
const app = express();
const path = require('path');
const ejsmate = require('ejs-mate');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');


const User = require('./models/user');
const Userinfo = require('./models/userinfo');
const { findById } = require('./models/userinfo');
const MongoStore = require('connect-mongo');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/project';

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false })
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!")
    })
    .catch(err => {
        console.log("OH NO MONGO ERROR!!!")
        console.log(err)
});



app.engine('ejs', ejsmate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use(express.static('views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const store = new MongoStore({
    mongoUrl: 'mongodb://localhost:27017/project',
    secret ,
    touchAfter: 24 * 60 * 60
});

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialzed: false,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000*60*60*24*7
    }
}

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
 
app.use((req, res, next) => {
    // console.log(req.session);
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.errors = req.flash('error');
    next();
})

const isLoggedIn = (req, res, next) => {
    // console.log('Req User', req.user);
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first !!!');
        return res.redirect('/login');
    }
    next();
}


app.get('/sign-up', async (req, res) => {
    res.render('pages/sign-up');
})

app.post('/sign-up', async (req, res, next) => {
    const { email, username, password } = req.body;
    const user = new User({ email, username });
    const registeredUser = await User.register(user, password);
    console.log(registeredUser);
    req.login(registeredUser, err => {
        if (err) return next(err);
        req.flash('success','Welcome to VR !!');
        res.redirect('/info');
    })
    
})

app.get('/login', async (req, res) => {
    res.render('pages/login');
})

app.post('/login', passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}),async (req, res) => {
    req.flash('success', 'Welcome back !!');
    const redirectUrl = req.session.returnTo || '/about';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
})

app.get('/info/new', isLoggedIn, async (req, res) => {
    res.render('pages/new');
})

app.post('/new',isLoggedIn, async (req, res) => {
    const user = new Userinfo(req.body);
    user.author = req.user._id;
    await user.save();
    const { id } = req.user;
    const user1 = await User.findById(id).populate('userinfo');
    user1.userinfo = user;
    await user1.save();
    console.log(user1);
    req.flash('success', 'Your info has been saved !!' );
    res.redirect(`/info/${user._id}` );
})

app.get('/', async (req, res) => {
    res.render('pages/about');
})

app.get('/info', isLoggedIn, async (req, res) => {
    const { id } = req.user;
    const user = await User.findById(id).populate('userinfo');
    res.render('pages/info', {user});
})

app.get('/info/:id',isLoggedIn, async (req, res) => {
    const user = await Userinfo.findById(req.params.id).populate('author');
    res.render('pages/show', { user });
})

app.get('/info/:id/update', isLoggedIn, async (req, res) => {
    const user = await Userinfo.findById(req.params.id).populate('author');
    res.render('pages/update', { user });
})

app.put('/info/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const user = await Userinfo.findByIdAndUpdate(id, { ...req.body }, { new: true });
    req.flash('success', 'Information Updated !!');
    res.redirect(`/info/${user._id}`);
})

app.delete('/info/:id',isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const user = await Userinfo.findByIdAndDelete(id);
    req.flash('success', 'Information Deleted !!');
    res.redirect('/about');
})

app.get('/logout', (req, res) => {
    req.logOut();
    req.flash('success', 'Goodbye!!');
    res.redirect('/about');
})
app.get('/contact', async (req, res) => {
    res.render('pages/contact');
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`serving on port ${port}`);
})