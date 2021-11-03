const { model, Schema } = require("mongoose");

const PostSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    text: {
      type: String,
      required: true,
    },
    name: String,
    avatar: String,
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    comments: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "user",
        },
        text: {
          type: String,
          required: true,
        },
        name: String,
        avatar: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = Post = model("post", PostSchema);
