const router = require("express").Router();
const Profile = require("../../models/Profile");
const _ = require("lodash");
const User = require("../../models/User");

// check middleware
const { check, validationResult } = require("express-validator");
const { getChecks } = require("../../utils/userChecks");
const postProfileCheck = _.constant([
  { field: "status", message: "Status is required", notEmpty: true },
  { field: "skills", message: "Skills are required", notEmpty: true },
]);

// middleware
const { checkToken } = require("../../middleware/auth");

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get("/me", checkToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );

    if (!profile) {
      return res
        .status(400)
        .json({ errors: [{ msg: "There is no profile for this user" }] });
    }

    return res.json(profile);
  } catch ({ message: msg }) {
    console.error(msg);
    res.status(500).json({ errors: [{ msg }] });
  }
});

// @route   POST api/profile
// @desc    Create or update a user profile
// @access  Private
router.post(
  "/",
  [checkToken, getChecks(check, postProfileCheck())],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // build profile object

    const profileInfo = {
      ...req.body,
      user: req.user.id,
      skills: req.body.skills.split(",").map((skill) => skill.trim()),
      social: {
        youtube: req.body.youtube,
        twitter: req.body.twitter,
        facebook: req.body.facebook,
        linkedin: req.body.linkedin,
        instagram: req.body.instagram,
        discord: req.body.discord,
      },
    };

    try {
      // Update if found
      const profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        {
          $set: profileInfo,
        },
        { new: true }
      ).exec();

      // Create if profile doesn't exist
      if (!profile) {
        const profile = await new Profile(profileInfo).save();

        return res.json(profile);
      }
      return res.json(profile);
    } catch ({ message: msg }) {
      console.error(msg);
      return res.status(500).json({ errors: [{ msg }] });
    }
  }
);

// @route   GET api/profile/all
// @desc    get all profiles
// @access  Public
router.get("/all", async (req, res) => {
  try {
    const profiles = await Profile.find({})
      .populate("user", ["name", "avatar"])
      .exec();
    return res.json(profiles);
  } catch ({ message: msg }) {
    console.error(msg);
    return res.status(500).json({ errors: [{ msg }] });
  }
});

// @route   GET api/profile/user/:id
// @desc    get profile by user id
// @access  Public
router.get("/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const profile = await Profile.findById(id)
      .populate("user", ["name", "avatar"])
      .exec();
    if (!profile)
      return res.status(404).json({ errors: [{ msg: "Profile not found" }] });
    return res.json(profile);
  } catch ({ message: msg }) {
    console.error(msg);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ errors: [{ msg: "Profile not found" }] });
    }
    return res.status(500).json({ errors: [{ msg }] });
  }
});

module.exports = router;
