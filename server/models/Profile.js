const { model, Schema } = require("mongoose");

const ProfileSchema = Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    company: String,
    website: String,
    location: String,
    status: {
      type: String,
      required: true,
    },
    skills: {
      type: [String],
      required: true,
    },
    bio: String,
    guthubusername: String,
    experience: [
      {
        title: {
          type: String,
          required: true,
        },
        company: {
          type: String,
          required: true,
        },
        location: String,
        from: Date,
        to: Date,
        current: {
          type: Boolean,
          default: false,
        },
        description: String,
      },
    ],
    education: [
      {
        school: {
          type: String,
          required: true,
        },
        degree: {
          type: String,
          required: true,
        },
        fieldofstudy: {
          type: String,
          required: true,
        },
        from: {
          type: Date,
          required: true,
        },
        to: {
          type: Date,
          required: true,
        },
        current: {
          type: Boolean,
          default: false,
        },
        description: String,
      },
    ],
    social: {
      youtube: String,
      twitter: String,
      facebook: String,
      linkedin: String,
      instagram: String,
      discord: String,
    },
  },
  { timestamps: true }
);

module.exports = Profile = model("profile", ProfileSchema);
