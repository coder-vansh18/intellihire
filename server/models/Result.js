const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test"
  },
  score: Number,
  total: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Result", resultSchema);