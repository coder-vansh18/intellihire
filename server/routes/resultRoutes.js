const express = require("express");
const router = express.Router();
const Result = require("../models/Result");

// ✅ SAVE RESULT
router.post("/", async (req, res) => {
  try {
    const { userId, userName, testId, score, total } = req.body;

    const newResult = new Result({
      userId,
      userName,
      testId,
      score,
      total
    });

    await newResult.save();

    res.json({ message: "Result saved" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET RESULTS FOR STUDENT
router.get("/student/:id", async (req, res) => {
  try {
    const results = await Result.find({ userId: req.params.id })
      .populate("testId", "title")
      .sort({ createdAt: -1 });

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Error fetching student results" });
  }
});

// ✅ GET ALL RESULTS (for company)
router.get("/", async (req, res) => {
  const results = await Result.find()
    .populate("testId", "title");
  res.json(results);
});

module.exports = router;