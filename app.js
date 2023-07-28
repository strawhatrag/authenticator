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
// GOOGLE OAUTH
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user.id); // Serialize only the user's id
  });
});

passport.deserializeUser(function (id, cb) {
  User.findById(id)
    .then((user) => {
      cb(null, user);
    })
    .catch((err) => {
      cb(err);
    });
});

// google oauth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/authenticator",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      // Check if the profile object has the necessary data
      if (!profile || !profile.displayName) {
        return cb(new Error("Invalid Google profile data"));
      }

      // Use the displayName as the username
      const username = profile.displayName;

      // Find or create the user using the username
      User.findOrCreate(
        { googleId: profile.id, username: username },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

app.get("/", (req, res) => {
  res.render("home");
});

//return statement to initiate the authentication process. Without it, the authentication process will not be triggered
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/authenticator",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

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
