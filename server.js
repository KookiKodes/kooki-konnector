const express = require("express");
const connectDB = require("./config/db");
require("dotenv").config();

const PORT = process.env.PORT;

// Connect Database
connectDB();
const app = express();

// Init Middleware
app.use(express.json({ extended: false }));

app.get("/", (req, res) => res.send("API Running"));

// Define Routes
app.use("/api/user", require("./routes/api/user"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/post", require("./routes/api/post"));

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
