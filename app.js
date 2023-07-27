//jshint esversion:6
require("dotenv").config(); // dotenv
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// 1
app.use(
  session({
    secret: "strawhat luffy",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Change secure to false for development
  })
);

app.use(passport.initialize());

app.use(passport.session());

//-------------------------------------
mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser()); // close cookie
passport.deserializeUser(User.deserializeUser()); // open cookie

app.get("/", (req, res) => {
  res.render("home");
});

//login
app.get("/login", (req, res) => {
  res.render("login");
});

//register
app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    console.log("not authenticated");
    res.redirect("/login");
  }
});
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = new User({
    username: username,
    password: password,
  });

  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local", {
        failureRedirect: "/login",
        failureMessage: true,
      })(req, res, () => {
        if (req.isAuthenticated()) {
          res.redirect("/secrets"); // Redirect to the secrets page if authenticated
        } else {
          res.redirect("/login"); // Redirect to the login page if not authenticated (shouldn't happen here, but just in case)
        }
      });
    }
  });
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  await User.register({ username: username }, password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      console.log("success");
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, () => {
  console.log("listening on http://localhost:3000");
});
