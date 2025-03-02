const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so that your frontend can fetch data from the backend
app.use(cors());

app.get("/api/movies", (req, res) => {
  const filePath = path.join(__dirname, "src/data/movies.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Failed to load data" });
    }
    res.json(JSON.parse(data));
  });
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

