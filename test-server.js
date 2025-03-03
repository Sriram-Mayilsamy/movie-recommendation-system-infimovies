const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS (Allow all origins for now)
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// MongoDB connection string
const MONGODB_URI = "mongodb+srv://sriram:sri8248950703@movies.q0bqf.mongodb.net/movies?retryWrites=true&w=majority&appName=movies";
//const MONGODB_URI = "mongodb+srv://sriram:sri8248950703@movies.q0bqf.mongodb.net/?retryWrites=true&w=majority&appName=movies"

console.log("Connecting to MongoDB...");
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB Atlas successfully"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit if DB connection fails
  });

// Define Movie Schema
const movieSchema = new mongoose.Schema({
  title: String,
  year: Number,
  cast: [String],
  genres: [String],
}, { strict: false });

const Movie = mongoose.model("Movie", movieSchema);

// Root Route
app.get("/", (req, res) => {
  res.json({ status: "✅ Server is running" });
});

// Movies API with Pagination & Search
app.get("/api/movies", async (req, res) => {
  try {
    console.log("📥 Request received at /api/movies");
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const searchTerm = req.query.search || '';

    console.log(`🔍 Search Term: "${searchTerm}", Page: ${page}, Limit: ${limit}`);

    const query = searchTerm ? { title: { $regex: searchTerm, $options: 'i' } } : {};
    
    const total = await Movie.countDocuments(query);
    console.log(`📊 Total matching movies: ${total}`);

    const movies = await Movie.find(query).skip((page - 1) * limit).limit(limit);

    console.log(`📤 Returning ${movies.length} movies`);
    res.json({
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      movies
    });
  } catch (error) {
    console.error("❌ Error in /api/movies:", error);
    res.status(500).json({ error: "Failed to load data", details: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
