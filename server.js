const express = require("express");
require("dotenv").config();

const PORT = process.env.PORT;

const app = express();

app.get("/", (req, res) => res.send("API Running"));

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
