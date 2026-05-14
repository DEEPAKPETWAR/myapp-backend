const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());


app.use("/uploads", express.static("uploads"));
// DB
connectDB();

// Root Route
app.get("/", (req, res) => {
  res.send("Backend Running");
});

// Routes
app.use("/api/auth", require("./routes/auth"));

// PORT
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});