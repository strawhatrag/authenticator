//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

//encryption
const secret = "simplestringsecret";
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

const User = mongoose.model("User", userSchema); // Use mongoose.model, not mongoose.Model

app.get("/", (req, res) => {
  res.render("home");
});

//login
app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", async (req, res) => {
  const uname = req.body.username;
  const pswd = req.body.password;

  let user = await User.findOne({ email: uname });
  if (user && user.password == pswd) {
    console.log("valid user");
  } else {
    console.error("username or password incorrect");
  }

  res.render("secrets");
});

//register
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const newUser = new User({
    email: req.body.username,
    password: req.body.password,
  });

  await newUser.save();
  res.render("secrets");
});

app.listen(3000, () => {
  console.log("listening on http://localhost:3000");
});
