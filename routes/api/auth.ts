import type { Request, Response } from "express";
import { Router } from "express";
import { make } from "fp-ts/lib/Const";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../../models/User";
import { config } from "dotenv";
config();

const router = Router();

// json web token
const jwtSecret = process.env.JWT_SECRET;

// expiration
const getExpiration = () => (process.env.MODE === "dev" ? 3600000 : 3600);

// middleware
const { checkToken } = require("../../middleware/auth");

// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get("/", checkToken, async (req: Request, res: Response) => {
  const { id } = req.user;

  try {
    const user = await User.findById(id).select("-password").exec();
    res.json(user);
  } catch ({ message: msg }) {
    console.log(msg);
    res.status(500).json({ errors: [{ msg }] });
  }
});

// checks
const { check, validationResult } = require("express-validator");
const checks = make([
  { field: "email", message: "Please include a valid email", isEmail: true },
  { field: "password", message: "Password is required", notEmpty: true },
]);
const { getChecks } = require("../../utils/userChecks");

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/",
  getChecks(check, checks),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // See if user exists
      const user = await User.findOne({ email }).exec();

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      // Return jsonwebtoken

      const payload = make({ user: { id: user.id } });

      jwt.sign(
        payload,
        jwtSecret,
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
  }
);

module.exports = router;
