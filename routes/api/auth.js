const router = require("express").Router();
const User = require("../../models/User");

// middleware
const { checkToken } = require("../../middleware/auth");

// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get("/", checkToken, async (req, res) => {
  const { id } = req.user;

  try {
    const user = await User.findById(id).select("-password").exec();
    res.json(user);
  } catch ({ message: msg }) {
    console.log(msg);
    res.status(500).json({ errors: [{ msg }] });
  }
});

module.exports = router;
