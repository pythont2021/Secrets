//jshint esversion:6
require('dotenv').config()
console.log("NodeJs server is running...");

///////////////////////////// REQUIRE MODULES ///////////////////////

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption")
const bcrypt = require("bcrypt");
const saltRounds = 5;
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

///////////////////////////// APP CONFIGURE ///////////////////////

const app = express();
const port = 5000;
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended:true}));

app.use(session({
  secret:process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:false,
}));

app.use(passport.initialize());
app.use(passport.session());



///////////////////////////// DATABASE CONFIGURE ///////////////////////

mongoose.connect("mongodb://localhost:2717/userDB",{ useNewUrlParser: true, useUnifiedTopology: true});
// mongoose.set("useCreateIndex", true);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("Database connected...!!");
});

///// SCHEMA ////////////
const userSchema = new mongoose.Schema({
  email_id: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String

});

///// PLUGIN ////////////

// userSchema.plugin(encrypt, { secret: process.env.SECRET_KEY, encryptedFields: ["password"]});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

///// MODEL ////////////
const User = mongoose.model("User", userSchema);

///// passport sessions ////////////
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

///// passport google oauth ////////////
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({username: profile.emails[0].value, googleId:profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

///// passport facebook oauth ////////////
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


///////////////////////////// GET ROUTES ///////////////////////

app.get("/", (req, res)=>{
  res.render("home")
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email'] })
);

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.get('/auth/facebook',
  passport.authenticate('facebook')
);

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.get("/login", (req, res)=>{
  if (req.isAuthenticated()){
    res.redirect("secrets")
  }else{
    res.render("login")
  }
});

app.get("/register", (req, res)=>{
  if (req.isAuthenticated()){
    res.redirect("secrets")
  }else{
    res.render("register")
  }
});

app.get("/secrets", (req, res)=>{
  if (req.isAuthenticated()){

      res.render("secrets")
  }else{
    res.redirect("login")
  }
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/submit', function(req, res){
  if (req.isAuthenticated()){
    res.render("submit")
  }else{
    res.redirect("login")
  }
});



///////////////////////////// POST ROUTES ///////////////////////

app.post("/register", (req, res)=>{

  User.register({username:req.body.username}, req.body.password, (err, user)=>{
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, ()=>{
        res.redirect("/secrets");
      })
    }
  });
});


app.post("/login", (req, res)=>{

  const user = new User ({
    username:req.body.username,
    password:req.body.password
  });

  req.login(user, (err)=>{
    if(err){
      console.log(err);
      res.redirect("/login");
    }else{
      passport.authenticate("local")(req, res, ()=>{
        res.redirect("/secrets");
      })
    }
  });
});







///////////////////////////// APP LISTEN  ///////////////////////

app.listen(port, ()=>{
  console.log(`App listing @ http://localhost:${port}` );
})
