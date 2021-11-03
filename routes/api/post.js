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

// @route   GET api/post
// @desc    Get all posts
// @access  Private
router.get("/all", checkToken, async (req, res) => {
  try {
    const posts = await Post.find({}).sort({ createdAt: -1 }).exec();
    return res.json(posts);
  } catch ({ message: msg }) {
    console.error(msg);
    return res.status(500).json({ errors: [{ msg }] });
  }
});

// @route   GET api/post/:id
// @desc    Get post by id
// @access  Private
router.get("/:post_id", checkToken, async (req, res) => {
  const { post_id } = req.params;

  try {
    const post = await Post.findById(post_id).exec();
    return res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ errors: [{ msg: "Post not found!" }] });
    }
    return res.status(500).json({ errors: [{ msg: err.message }] });
  }
});

// @route   GET api/post/all/:user_id
// @desc    Get all posts by user id
// @access  Private
router.get("/all/:user_id", checkToken, async (req, res) => {
  const { user_id } = req.params;

  try {
    const posts = await Post.find({ user: user_id }).exec();
    return res.json(posts);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ errors: [{ msg: "Post not found!" }] });
    }
    return res.status(500).json({ errors: [{ msg: err.message }] });
  }
});

// checks
const putPostCheck = _.constant([
  { field: "text", message: "Text is required", notEmpty: true },
]);

// @route   PUT api/post/:post_id
// @desc    Update post by id
// @access  Private
router.put(
  "/:post_id",
  [checkToken, getChecks(check, putPostCheck())],
  async (req, res) => {
    const {
      params: { post_id },
      user: { id },
    } = req;

    try {
      const post = await Post.findOneAndUpdate(
        { user: id, _id: post_id },
        {
          text: req.body.text,
        },
        { new: true }
      ).exec();
      if (!post)
        return res
          .status(400)
          .json({ errors: [{ msg: "Could not update post" }] });
      return res.json(post);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(400).json({ errors: [{ msg: "Post not found!" }] });
      }
      return res.status(500).json({ errors: [{ msg: err.message }] });
    }
  }
);

// @route   DELETE api/post/:post_id
// @desc    Delete post by id
// @access  Private
router.delete("/:post_id", checkToken, async (req, res) => {
  const {
    params: { post_id },
    user: { id },
  } = req;

  try {
    const post = await Post.findOneAndRemove({ user: id, _id: post_id }).exec();
    if (!post)
      return res
        .status(400)
        .json({ errors: [{ msg: "Could not delete post" }] });

    return res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ errors: [{ msg: "Post not found!" }] });
    }
    return res.status(500).json({ errors: [{ msg: err.message }] });
  }
});

// @route   PUT api/post/like/:post_id
// @desc    Add like to post by id
// @access  Private
router.put("/like/:post_id", checkToken, async (req, res) => {
  const {
    user: { id },
    params: { post_id },
  } = req;
  try {
    const post = await Post.findOneAndUpdate(
      { _id: post_id },
      {
        $addToSet: { likes: id },
      },
      { new: true }
    ).exec();

    if (!post) {
      return res.status(400).json({ errors: [{ msg: "No post found!" }] });
    }

    return res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ errors: [{ msg: "Post not found!" }] });
    }
    return res.status(500).json({ errors: [{ msg: err.message }] });
  }
});

// @route   DELETE api/post/like/:post_id
// @desc    Remove like from post by id
// @access  Private
router.delete("/like/:post_id", checkToken, async (req, res) => {
  const {
    user: { id },
    params: { post_id },
  } = req;
  try {
    const post = await Post.findOneAndUpdate(
      { _id: post_id },
      {
        $pull: { likes: id },
      },
      { new: true }
    ).exec();

    if (!post) {
      return res.status(400).json({ errors: [{ msg: "No post found!" }] });
    }

    return res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ errors: [{ msg: "Post not found!" }] });
    }
    return res.status(500).json({ errors: [{ msg: err.message }] });
  }
});

module.exports = router;
