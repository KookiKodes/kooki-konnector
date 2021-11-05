import type { Request, Response, NextFunction } from "express";
import type { Either } from "fp-ts/Either";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "dotenv";
import * as E from "fp-ts/Either";
import { error } from "fp-ts/Console";
import { make } from "fp-ts/lib/Const";
import { flow } from "fp-ts/lib/function";
config();

const jwtSecret = make(process.env.JWT_SECRET as string);
const noTokenError = Error("No token, authorization denied.");

// logs error message
const logError = (err: Error) => error(err.message)();

// Send response error
const sendErrorRes = (res: Response, code: number) => (err: Error) => {
  res.status(code).json({ errors: [{ msg: err.message }] });
  return err;
};

// tries to decode received token from secret, catches error if any
const decode = (secret: string) => (token: string) =>
  E.tryCatch<Error, JwtPayload>(
    () => jwt.verify(token, secret) as JwtPayload,
    E.toError
  );

// set's user object to req.user for other Request Handlers
const setReq = (req: Request, next: NextFunction) => (payload: JwtPayload) => {
  req.user = payload.user;
  next();
};

// if error already return error else we attempt to decode secret
const handleDecode = (e: Either<Error, string>) =>
  E.isLeft(e) ? E.left(e.left) : decode(jwtSecret)(e.right);

// sends error response and logs error to console
const respond = (res: Response) => flow(sendErrorRes(res, 401), logError);

// if token does not exists within header, throw error else return token
const getToken = (req: Request): Either<Error, string> =>
  !req.header("x-auth-token")
    ? E.left(noTokenError)
    : E.right(req.header("x-auth-token"));

const handleResponse =
  (req: Request, res: Response, next: NextFunction) =>
  (e: Either<Error, JwtPayload>) =>
    E.fold<Error, JwtPayload, void>(respond(res), setReq(req, next))(e);

export const checkToken = (req: Request, res: Response, next: NextFunction) =>
  flow(getToken, handleDecode, handleResponse(req, res, next))(req);
