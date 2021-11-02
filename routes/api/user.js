const router = require("express").Router();
const _ = require("lodash");
const User = require("../../models/User");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
require("dotenv").config();
const { check, validationResult } = require("express-validator");

const getExpiration = () => (process.env.MODE === "dev" ? 3600000 : 3600);

// Initial registration tests
const checks = _.constant([
  { field: "name", message: "Name is required" },
  { field: "email", message: "Please include a valid email" },
  {
    field: "password",
    message: "Please enter a password with 6 or more characters",
  },
]);

const getFieldNameCheck = _.curry((check, info) =>
  check(info.field, info.message).not().isEmpty()
);
const getFieldEmailCheck = _.curry((check, info) =>
  check(info.field, info.message).isEmail()
);
const getFieldPwordCheck = _.curry((check, info) =>
  check(info.field, info.message).isLength({ min: 6 })
);

const handleField = (check) =>
  _.cond([
    [_.matches({ field: "name" }), getFieldNameCheck(check)],
    [_.matches({ field: "email" }), getFieldEmailCheck(check)],
    [_.matches({ field: "password" }), getFieldPwordCheck(check)],
  ]);

const getChecks = (check, fields) => _.map(fields, handleField(check));

// @route   GET api/users
// @desc    Test route
// @access  Public
router.post("/", getChecks(check, checks()), async (req, res) => {
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
      config.get("jwtSecret"),
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
