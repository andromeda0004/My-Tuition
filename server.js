const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/ping', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Define routes (to be added in future phases)
// app.use('/api/students', require('./routes/students'));
// app.use('/api/attendance', require('./routes/attendance'));
// app.use('/api/fees', require('./routes/fees'));

// Create routes folder structure
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});
