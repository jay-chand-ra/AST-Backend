const Node = require('./Node');

function create_rule(rule_string) {
  // This is a simplified implementation
  const tokens = tokenize(rule_string);
  return buildAST(tokens);
}

function tokenize(rule_string) {
  // Split the rule string into tokens
  // This is a simplified tokenization process
  return rule_string.match(/\(|\)|\w+|[<>=]+|\d+|'[^']*'/g);
}

function buildAST(tokens) {
  // Recursive function to build the AST
  // This is a simplified implementation
  if (tokens.length === 0) return null;
  
  const token = tokens.shift();
  
  if (token === '(') {
    const left = buildAST(tokens);
    const operator = tokens.shift();
    const right = buildAST(tokens);
    tokens.shift(); // Remove closing parenthesis
    return new Node('operator', left, right, operator);
  } else {
    const operand = token;
    const operator = tokens.shift();
    const value = tokens.shift();
    return new Node('operand', null, null, `${operand} ${operator} ${value}`);
  }
}

module.exports = { create_rule };
