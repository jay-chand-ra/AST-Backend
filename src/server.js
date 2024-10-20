const express = require('express');
const cors = require('cors');
const ruleRoutes = require('./api/ruleRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Use '/api/rules' route
app.use('/api/rules', (req, res, next) => {
  console.log('Entering /api/rules route');
  ruleRoutes(req, res, next);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
