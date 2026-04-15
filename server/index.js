require("dotenv").config();
console.log("URI:", process.env.MONGO_URI);
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const resultRoutes = require("./routes/resultRoutes");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/results", resultRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});