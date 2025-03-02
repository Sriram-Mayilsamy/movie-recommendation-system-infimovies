const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so that your frontend can fetch data from the backend
app.use(cors());

// Add a basic route for testing
app.get("/", (req, res) => {
  res.json({ status: "Server is running" });
});

app.get("/api/movies", (req, res) => {
  try {
    // Try multiple possible file paths
    let filePath = path.join(__dirname, "src/data/movies.json");
    
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, "data/movies.json");
    }
    
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, "movies.json");
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Movies data file not found" });
    }

    const data = fs.readFileSync(filePath, "utf8");
    res.json(JSON.parse(data));
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to load data", details: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});