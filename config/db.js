const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const mongoURI = _.constant(process.env.MONGO_URI);
const connectOptions = _.constant({ useNewUrlParser: true });

const connect = _.curry(
  async (mongoose, uri, options) => await mongoose.connect(uri, options)
);

const handleError = (err) => {
  console.error(err.message);
  process.exit(1);
};
const handleSuccess = async (data) => {
  await data;
  console.log("MongoDB connected");
  return data;
};
const checkError = (data) =>
  _.isError(data) ? handleError(data) : handleSuccess(data);

const connectDB = (uri, options) => async () =>
  _.flow(await _.attempt(connect(mongoose)), checkError)(uri, options);

module.exports = connectDB(mongoURI(), connectOptions());
