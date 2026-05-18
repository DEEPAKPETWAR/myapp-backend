const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const multer =require("multer")
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// app.use("/uploads", express.static("uploads"));
app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);
app.use("/api/auth", require("./routes/auth"));


// DB
connectDB();

// Root Route
app.get("/", (req, res) => {
  res.send("Backend Running");
});


// PORT
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});