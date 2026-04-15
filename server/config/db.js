// const mongoose = require("mongoose");

// const connectDB = async () => {
//   try {
//     await mongoose.connect("mongodb://127.0.0.1:27017/intellihire");
//     console.log("MongoDB Connected");
//   } catch (error) {
//     console.log(error);
//   }
// };

// module.exports = connectDB;

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Atlas Connected 🚀");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDB;