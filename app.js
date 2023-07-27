//jshint esversion:6
require("dotenv").config(); // dotenv
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10; // bcrypt salt
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

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

  try {
    const user = await User.findOne({ email: uname });

    if (!user) {
      // User not found
      return res.status(401).send("Username or password incorrect");
    }

    const isValidPassword = await bcrypt.compare(pswd, user.password);

    if (isValidPassword) {
      // Password matches, valid user
      res.render("secrets"); // Assuming "secrets" is a valid template/view to render after successful login.
    } else {
      // Invalid password
      res.status(401).send("Username or password incorrect");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while logging in.");
  }
});

//register
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const newUser = new User({
      email: req.body.username,
      password: hashedPassword, // Store the hashed password in the database
    });

    await newUser.save();
    res.render("secrets"); // Assuming "secrets" is a valid template/view to render after successful registration.
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while registering the user.");
  }
});

app.listen(3000, () => {
  console.log("listening on http://localhost:3000");
});
