const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  verfied: { type: Boolean, default: false },
});

const UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel;
