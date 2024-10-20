function evaluate_rule(ast, data) {
  if (!ast) return true;

  if (ast.type === 'operator') {
    const leftResult = evaluate_rule(ast.left, data);
    const rightResult = evaluate_rule(ast.right, data);
    return ast.value === 'AND' ? leftResult && rightResult : leftResult || rightResult;
  } else {
    const [attribute, operator, value] = ast.value.split(' ');
    const dataValue = data[attribute];
    const ruleValue = value.replace(/'/g, '');

    switch (operator) {
      case '>': return dataValue > parseFloat(ruleValue);
      case '<': return dataValue < parseFloat(ruleValue);
      case '=': return dataValue == ruleValue;
      // Add more operators as needed
      default: return false;
    }
  }
}

module.exports = { evaluate_rule };
