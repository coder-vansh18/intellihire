const express = require("express");
const router = express.Router();
const Test = require("../models/Test");


// ✅ CREATE TEST
router.post("/", async (req, res) => {
  try {
    const { title, questions } = req.body;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ message: "Title and questions required" });
    }

    const newTest = new Test({
      title,
      questions
    });

    await newTest.save();

    res.status(201).json({
      message: "Test Created Successfully",
      test: newTest
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ GET ALL TESTS
router.get("/", async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tests" });
  }
});


// ✅ GET SINGLE TEST (🔥 REQUIRED FOR QUIZ PAGE)
router.get("/:id", async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Error fetching test" });
  }
});


// ✅ DELETE TEST (for company dashboard)
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Test.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.json({ message: "Test deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});


// ✅ UPDATE TEST (optional but useful)
router.put("/:id", async (req, res) => {
  try {
    const updatedTest = await Test.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedTest);
  } catch (err) {
    res.status(500).json({ message: "Error updating test" });
  }
});

module.exports = router;