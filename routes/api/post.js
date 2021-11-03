const router = require("express").Router();
const User = require("../../models/User");
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const _ = require("lodash");

// check middleware
const { check, validationResult } = require("express-validator");
const { getChecks } = require("../../utils/userChecks");
const postPostCheck = _.constant([
  { field: "text", message: "Text is required", notEmpty: true },
]);

// middleware
const { checkToken } = require("../../middleware/auth");

// @route   POST api/post
// @desc    Create a post
// @access  Private
router.post(
  "/",
  [checkToken, getChecks(check, postPostCheck())],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.user;

    try {
      const { avatar, name } = await User.findById(id)
        .select("-password")
        .exec();

      const newPost = await new Post({
        ...req.body,
        user: id,
        avatar,
        name,
      }).save();

      res.json(newPost);
    } catch ({ message: msg }) {
      console.error(msg);
      res.status(500).json({ errors: [{ msg }] });
    }
  }
);

module.exports = router;
