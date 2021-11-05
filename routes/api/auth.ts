import type { Request, Response } from "express";
import { Router } from "express";
import { make } from "fp-ts/lib/Const";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../../models/User";
import { pipe, constNull } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import { check, ValidationError, validationResult } from "express-validator";
import { buildChecks } from "../../utils/userChecks";
import { config } from "dotenv";

// middleware
import { checkToken } from "../../middleware/auth";

// checks
const checks = make([
  { field: "email", message: "Please include a valid email", isEmail: true },
  { field: "password", message: "Password is required", notEmpty: true },
]);

config();

// json web token
const jwtSecret = make(process.env.JWT_SECRET as string);
// expiration
const getExpiration = () => (process.env.MODE === "dev" ? 3600000 : 3600);

const invalidCreds = make("Invalid credentials!");

const findUserById = (id: string) => (): Promise<User> =>
  User.findById(id).select("-password").exec();
const findUserByEmail = async (req: Request): Promise<User> =>
  await User.findOne({ email: req.body.email }).exec();

const sendErrorRes = (res: Response, code: number) => (err: Error) => {
  if (err instanceof Array) {
    res.status(code).json({ errors: err });
  } else res.status(code).json({ errors: [{ msg: err.message }] });
};

const sendJsonRes = (res: Response) => (data: any) => {
  res.json(data);
};

const handleResponse = (res: Response) => (either: E.Either<Error, User>) =>
  E.fold(sendErrorRes(res, 400), sendJsonRes(res))(either);

const tryGetUserById = (req: Request) =>
  TE.tryCatch<Error, User>(findUserById(req.user.id), E.toError);

const tryValidateResult = (
  req: Request
): E.Either<ValidationError[], Request> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return E.left(errors.array());
  return E.right(req);
};

const userExists = (user: User) => {
  if (user === constNull()) throw Error(invalidCreds);
  return user;
};

const tryUserExists = (user: User) =>
  TE.tryCatch(async () => userExists(user), E.toError);

const passwordMatches =
  (req: Request, user: User) => async (): Promise<User> => {
    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) throw E.toError(invalidCreds);
    return user;
  };

const tryPasswordMatch = (req: Request) => (user: User) =>
  TE.tryCatch(passwordMatches(req, user), E.toError);
const tryFindUserByEmail = (req: Request) =>
  TE.tryCatch<Error, User>(() => findUserByEmail(req), E.toError);

const signAndRes = (res: Response) => (user: User) => {
  jwt.sign(
    { user: { id: user.id } },
    jwtSecret,
    { expiresIn: getExpiration() },
    (err, token) => {
      if (err) return sendErrorRes(res, 500)(err);
      res.json({ token });
    }
  );
};

const handleErrorRes = (res: Response) => (err: Error) =>
  sendErrorRes(res, 500)(err);

const router = Router();

// @route   GET api/auth
// @desc    Get user info
// @access  Public
const getUser = (req: Request, res: Response) =>
  pipe(tryGetUserById(req), T.map(handleResponse(res)))();

router.get("/", checkToken, getUser);

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public
//
const signInUser = (req: Request, res: Response) =>
  pipe(
    tryValidateResult(req),
    TE.fromEither,
    TE.chainW(tryFindUserByEmail),
    TE.chainW(tryUserExists),
    TE.chainW(tryPasswordMatch(req)),
    T.map(E.fold(handleErrorRes(res), signAndRes(res)))
  )();

router.post("/", buildChecks(check, checks), signInUser);

module.exports = router;
