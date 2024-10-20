const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  name: String,
  description: String,
  ruleString: String,
  ast: Object,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rule', ruleSchema);
