//jshint esversion:6
console.log("NodeJs server is running...");

///////////////////////////// REQUIRE MODULES ///////////////////////
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption")

///////////////////////////// APP CONFIGURE ///////////////////////

const app = express();
const port = 5000;
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended:true}));


///////////////////////////// DATABASE CONFIGURE ///////////////////////

mongoose.connect("mongodb://localhost:2717/userDB")
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("Database connected...!!");
});

///// SCHEMA ////////////
const userSchema = new mongoose.Schema({
  email_id: String,
  password: String
});

///// ENCRYPTION ////////////
var secret = "thisismysecretekey.";
userSchema.plugin(encrypt, { secret: secret , encryptedFields: ["password"]});

///// MODEL ////////////
const User = mongoose.model("User", userSchema);

///////////////////////////// GET ROUTES ///////////////////////

app.get("/", (req, res)=>{
  res.render("home")
});

app.get("/login", (req, res)=>{
  res.render("login")
});

app.get("/register", (req, res)=>{
  res.render("register")
});

app.get("/secrets", (req, res)=>{
  res.render("secrets")
});

///////////////////////////// POST ROUTES ///////////////////////

app.post("/register", (req, res)=>{

  const newUser = new User ({
    email_id: req.body.username,
    password:req.body.password
  });
  newUser.save((err)=>{
    if(err){
      console.log(err);
    }else{
      console.log("New user registered");
      res.render("secrets");
    }
  });
});

app.post("/login", (req, res)=>{
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email_id : username}, (err, foundUser)=>{
    if (err){
      console.log(err);
    } else{
      if(foundUser){
        if( foundUser.password === password){
          console.log("new user logged in");
          res.render("secrets")
        }else{
          res.send("<h1>password incorrect</h1>")
        }
      }else{
        res.send("<h1>username not found</h1>")
      }
    }
  });
});




///////////////////////////// APP LISTEN  ///////////////////////

app.listen(port, ()=>{
  console.log(`App listing @ http://localhost:${port}` );
})
