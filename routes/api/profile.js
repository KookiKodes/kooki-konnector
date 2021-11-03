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

// @route   DELETE api/profile
// @desc    Delete profile, user & posts
// @access  Private
router.delete("/", checkToken, async (req, res) => {
  const { id } = req.user;
  try {
    // @todo - remove user's posts

    // Remove profile
    await Profile.findOneAndRemove({ user: id });
    await User.findByIdAndRemove(id);

    res.json({ success: true, msg: "Profile sucessfully deleted." });
  } catch ({ message: msg }) {
    console.error(msg);
    return res.status(500).json({ errors: [{ msg }] });
  }
});

// put experience checks
const putExperienceChecks = _.constant([
  { field: "title", message: "Title is required", notEmpty: true },
  { field: "company", message: "Company is required", notEmpty: true },
  { field: "from", message: "From date is required", notEmpty: true },
]);

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put(
  "/experience",
  [checkToken, getChecks(check, putExperienceChecks())],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.user;

    try {
      const profile = await Profile.findOneAndUpdate(
        { user: id },
        {
          $push: {
            experience: {
              $each: [{ ...req.body }],
              $position: 0,
            },
          },
        },
        { new: true }
      ).exec();
      if (!profile)
        return res.status(404).json({ errors: [{ msg: "Profile not found" }] });

      res.json(profile);
    } catch ({ message: msg }) {
      console.error(msg);
      return res.status(500).json({ errors: [{ msg }] });
    }
  }
);

// @route   PUT api/profile/experience/:exp_id
// @desc    Delete profile experience
// @access  Private
router.put("/experience/:exp_id", checkToken, async (req, res) => {
  const {
    user: { id },
    params: { exp_id },
  } = req;
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: id },
      { $pull: { experience: { _id: exp_id } } },
      { new: true }
    ).exec();
    res.json(profile);
  } catch ({ message: msg }) {
    console.error(msg);
    return res.status(500).json({ errors: [{ msg }] });
  }
});

// put experience checks
const putEduChecks = _.constant([
  { field: "school", message: "School is required", notEmpty: true },
  { field: "degree", message: "Degree is required", notEmpty: true },
  { field: "from", message: "From date is required", notEmpty: true },
  {
    field: "fieldofstudy",
    message: "Field of study is required",
    notEmpty: true,
  },
]);

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put(
  "/education",
  [checkToken, getChecks(check, putEduChecks())],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.user;

    try {
      const profile = await Profile.findOneAndUpdate(
        { user: id },
        {
          $push: {
            education: {
              $each: [{ ...req.body }],
              $position: 0,
            },
          },
        },
        { new: true }
      ).exec();
      if (!profile)
        return res.status(404).json({ errors: [{ msg: "Profile not found" }] });

      res.json(profile);
    } catch ({ message: msg }) {
      console.error(msg);
      return res.status(500).json({ errors: [{ msg }] });
    }
  }
);

// @route   PUT api/profile/education/:edu_id
// @desc    Delete profile education
// @access  Private
router.put("/education/:edu_id", checkToken, async (req, res) => {
  const {
    user: { id },
    params: { edu_id },
  } = req;
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: id },
      { $pull: { education: { _id: edu_id } } },
      { new: true }
    ).exec();
    res.json(profile);
  } catch ({ message: msg }) {
    console.error(msg);
    return res.status(500).json({ errors: [{ msg }] });
  }
});

module.exports = router;
