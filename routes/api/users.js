const express = require("express");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");

const router = express.Router();

// Load user model

const User = require("../../models/User");

// @route   GET api/users/test
// @desc    Tests post route
// @access  Public
router.get("/test", (req, res) => res.json({ msg: "users works" }));

// @route   GET api/users/register
// @desc    Register a user
// @access  Public
router.post("/register", (req, res) => {
  User.findOne({ email: req.body.email })
    .then(user => {
      if (user) {
        return res.status(400).json({ email: "Email already exists." });
      } else {
        const avatar1 = gravatar.url(req.body.email, {
          s: "200", // Size of avatar
          r: "pg", // Rating of the avatar
          d: "mm" // Default image
        });
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          avatar: avatar1,
          password: req.body.password
        });
        console.log(newUser);
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            console.log(err);
            newUser.password = hash;
            newUser
              .save()
              .then(user => res.json(user))
              .catch(err => console.log(err));
          });
        });
      }
    })
    .catch(err => console.log(err));
});

module.exports = router;
