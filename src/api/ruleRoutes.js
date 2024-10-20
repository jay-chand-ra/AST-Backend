const express = require('express');
const RuleService = require('../services/RuleService');

const router = express.Router();

// GET all rules
router.get('/', async (req, res) => {
  console.log('GET /api/rules route hit');
  try {
    const rules = await RuleService.getAllRules();
    console.log('Rules fetched:', rules);
    res.json(rules);
  } catch (error) {
    console.error('Error getting all rules:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST a new rule
router.post('/', async (req, res) => {
  console.log('POST /api/rules route hit', req.body);
  try {
    const newRule = await RuleService.createRule(req.body);
    console.log('Rule created successfully:', newRule);
    res.status(201).json(newRule);
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(400).json({ message: error.message });
  }
});

// POST combine rules
router.post('/combine', async (req, res) => {
  console.log('POST /api/rules/combine route hit', req.body);
  try {
    const combinedRule = await RuleService.combineRules(req.body.rules);
    console.log('Rules combined successfully:', combinedRule);
    res.status(200).json(combinedRule);
  } catch (error) {
    console.error('Error combining rules:', error);
    res.status(400).json({ message: error.message });
  }
});

// POST evaluate rule
router.post('/evaluate', async (req, res) => {
  console.log('POST /api/rules/evaluate route hit', req.body);
  try {
    const { ruleId, data } = req.body;
    if (!ruleId || !data) {
      throw new Error('Missing ruleId or data in request body');
    }
    const result = await RuleService.evaluateRule(ruleId, data);
    console.log('Rule evaluated successfully:', result);
    res.status(200).json({ result });
  } catch (error) {
    console.error('Error evaluating rule:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
