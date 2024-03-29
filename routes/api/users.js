const express = require("express");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

// Load input validation
const validateRegisterInput = require("../../validations/register");
const validateLoginInput = require("../../validations/login");

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
  const { errors, isValid } = validateRegisterInput(req.body);

  // check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOne({ email: req.body.email })
    .then(user => {
      if (user) {
        errors.email = "Email already exists.";
        return res.status(400).json(errors);
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
        // console.log(newUser);
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
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

// @route   GET api/users/login
// @desc    Login a user / Return JWT tocken
// @access  Public
router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  // check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email }).then(user => {
    // check if user has returned

    if (!user) {
      errors.email = "User not found.";
      return res.status(404).json(errors);
    }

    // compare password from request to database
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // user matched
        const payload = { id: user._id, name: user.name, avatar: user.avatar }; // create JWT payload
        // assign jwt
        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 3600 },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token
            });
          }
        );
      } else {
        errors.password = "Password is incorrect.";
        return res.status(400).json(errors);
      }
    });
  });
});

// @route   GET api/users/current
// @desc    Return current user
// @access  Private

router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      password: req.user.password,
      password2: req.user.password2
    });
  }
);

module.exports = router;
