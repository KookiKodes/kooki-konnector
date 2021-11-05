import type { Mongoose } from "mongoose";
import mongoose from "mongoose";
import { map } from "fp-ts/Task";
import { fold, toError } from "fp-ts/Either";
import { tryCatch, of } from "fp-ts/TaskEither";
import { log, error } from "fp-ts/Console";
import { pipe, flow } from "fp-ts/function";
import { make } from "fp-ts/Const";
import { config } from "dotenv";
config();

const mongoURI = make<string>(process.env.MONGO_URI as string);

// connect to mongo db with givin uri and mongo object
const connect = (mongo: Mongoose, uri: string) => async (): Promise<Mongoose> =>
  await mongo.connect(uri);

// logs before attempting to connect
const logBeforeConnect = log("Attempting to connect to mongoDB");

// logs successful connection
const logSuccessConnect = log("Connected to mongoDB");

// logs error message
const logErrorConnect = (err: Error) => error(err.message)();

// left -> log error | right -> log success message
const handleAfterConnect = map(
  fold<Error, Mongoose, void>(logErrorConnect, logSuccessConnect)
);

// attempt to connect to mongo and catch any errors.
const tryConnect = tryCatch<Error, Mongoose>(
  //
  // connects to mongo db
  connect(mongoose, mongoURI),

  // converts error if any
  toError
);

const connectDB = flow(logBeforeConnect, pipe(tryConnect, handleAfterConnect));

export default connectDB;
