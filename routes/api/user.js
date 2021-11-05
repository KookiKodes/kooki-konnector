const router = require("express").Router();
const _ = require("lodash");
const User = require("../../models/User");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { check, validationResult } = require("express-validator");

// checks
const checks = _.constant([
  { field: "name", message: "Name is required", notEmpty: true },
  { field: "email", message: "Please include a valid email", isEmail: true },
  {
    field: "password",
    message: "Please enter a password with 6 or more characters",
    minLength: true,
  },
]);
const { buildChecks } = require("../../utils/userChecks");

const getExpiration = () => (process.env.MODE === "dev" ? 3600000 : 3600);

// @route   POST api/users
// @desc    Test route
// @access  Public
router.post("/", buildChecks(check, checks()), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // See if user exists
    const user = await User.findOne({ email }).exec();

    if (user) {
      return res.status(400).json({ errors: [{ msg: "User already exists" }] });
    }

    // Get user's Gravatar

    const avatar = gravatar.url(email, {
      s: "200",
      rating: "pg",
      d: "mm",
    });

    const newUser = new User({
      name,
      email,
      avatar,
      password,
    });

    // Encrypt password

    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    await newUser.save();

    // Return jsonwebtoken

    const payload = _.constant({ user: { id: newUser.id } });

    jwt.sign(
      payload(),
      process.env.JWT_SECRET,
      { expiresIn: getExpiration() },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch ({ message: msg }) {
    console.error(msg);
    res.status(500).json({ errors: [{ msg }] });
  }
});

module.exports = router;
