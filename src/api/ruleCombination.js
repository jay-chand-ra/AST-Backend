const { create_rule } = require('./ruleCreation');
const Node = require('./Node');

function combine_rules(rules) {
  if (rules.length === 0) return null;
  if (rules.length === 1) return create_rule(rules[0]);
  
  const asts = rules.map(create_rule);
  return asts.reduce((combined, ast) => new Node('operator', combined, ast, 'AND'));
}

module.exports = { combine_rules };
