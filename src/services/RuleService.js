const Node = require('../models/Node');
const fs = require('fs').promises;
const path = require('path');

const RULES_FILE = path.join(__dirname, '../data/rules.json');

class RuleService {
  static createRule(ruleString) {
    // Implement parsing logic to convert ruleString to AST
    const ast = this.parseRule(ruleString);
    return ast;
  }

  static combineRules(rules) {
    // Implement logic to combine multiple rules
    const asts = rules.map(rule => this.createRule(rule));
    
    // Strategy: Use the most frequent operator as the root
    const operators = asts.flatMap(ast => this.collectOperators(ast));
    const mostFrequentOp = this.getMostFrequent(operators);

    const combinedAst = new Node('operator', mostFrequentOp);
    asts.forEach(ast => {
      if (!combinedAst.left) {
        combinedAst.left = ast;
      } else if (!combinedAst.right) {
        combinedAst.right = ast;
      } else {
        combinedAst.right = new Node('operator', mostFrequentOp, combinedAst.right, ast);
      }
    });

    return combinedAst;
  }

  static evaluateRule(rule, data) {
    const ast = this.jsonToAst(rule.ast);
    return this.evaluateAst(ast, data);
  }

  static parseRule(ruleString) {
    try {
      const tokens = ruleString.match(/\w+|>=|<=|>|<|=|\(|\)|\s+/g).filter(token => token.trim() !== '');
      return this.parseExpression(tokens);
    } catch (error) {
      throw new Error(`Error parsing rule: ${error.message}`);
    }
  }

  static parseExpression(tokens) {
    let left = this.parseTerm(tokens);
    while (tokens.length > 0 && (tokens[0].toLowerCase() === 'and' || tokens[0].toLowerCase() === 'or')) {
      const operator = tokens.shift().toUpperCase();
      const right = this.parseTerm(tokens);
      left = new Node('operator', operator, left, right);
    }
    return left;
  }

  static parseTerm(tokens) {
    const left = tokens.shift();
    if (['>', '<', '>=', '<=', '='].includes(tokens[0])) {
      const operator = tokens.shift();
      const right = tokens.shift();
      return new Node('operator', operator, new Node('operand', left), new Node('operand', right));
    }
    return new Node('operand', left);
  }

  static combineAsts(asts) {
    // Simplified combination strategy: combine with AND
    return asts.reduce((combined, ast) => {
      return new Node('operator', 'AND', combined, ast);
    });
  }

  static astToString(ast) {
    if (ast.type === 'operand') {
      return ast.value;
    }
    if (ast.type === 'operator') {
      const left = this.astToString(ast.left);
      const right = this.astToString(ast.right);
      return `(${left} ${ast.value} ${right})`;
    }
  }

  static jsonToAst(json) {
    if (!json) return null;
    return new Node(
      json.type,
      json.value,
      this.jsonToAst(json.left),
      this.jsonToAst(json.right)
    );
  }

  static evaluateAst(ast, data) {
    if (ast.type === 'operand') {
      const value = ast.value in data ? data[ast.value] : ast.value;
      console.log(`Evaluating operand: ${ast.value} = ${value}`);
      return value;
    }
    if (ast.type === 'operator') {
      const left = this.evaluateAst(ast.left, data);
      const right = this.evaluateAst(ast.right, data);
      console.log(`Evaluating operator: ${left} ${ast.value} ${right}`);
      switch (ast.value.toUpperCase()) {
        case 'AND': return left && right;
        case 'OR': return left || right;
        case '>': return Number(left) > Number(right);
        case '<': return Number(left) < Number(right);
        case '>=': return Number(left) >= Number(right);
        case '<=': return Number(left) <= Number(right);
        case '=': return left == right;
        default: throw new Error(`Unknown operator: ${ast.value}`);
      }
    }
    throw new Error(`Invalid AST node type: ${ast.type}`);
  }

  static async saveRule(name, ruleString, ast) {
    const query = `
      INSERT INTO rules (name, rule_string, ast_json)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const values = [name, ruleString, JSON.stringify(ast)];
    const result = await db.query(query, values);
    return result.rows[0].id;
  }

  static async getRuleById(id) {
    const rules = await this.loadRules();
    const rule = rules.find(r => r.id === id);
    if (!rule) {
      throw new Error(`Rule with id ${id} not found`);
    }
    return rule;
  }

  static async createRule(name, ruleString) {
    try {
      const query = 'INSERT INTO rules (name, ruleString) VALUES (?, ?)';
      const result = await db.run(query, [name, ruleString]);
      return { id: result.id, name, ruleString };
    } catch (error) {
      console.error('Error in RuleService.createRule:', error);
      throw error;
    }
  }

  static async getAllRules() {
    try {
      console.log('Loading rules from file...');
      const rules = await this.loadRules();
      console.log('Rules loaded:', rules);
      return rules;
    } catch (error) {
      console.error('Error in getAllRules:', error);
      throw error;
    }
  }

  static collectOperators(ast) {
    if (!ast) return [];
    if (ast.type === 'operand') return [];
    return [ast.value, ...this.collectOperators(ast.left), ...this.collectOperators(ast.right)];
  }

  static getMostFrequent(arr) {
    return arr.sort((a,b) =>
      arr.filter(v => v === a).length - arr.filter(v => v === b).length
    ).pop();
  }

  static async getAttributeCatalog() {
    const query = 'SELECT name, data_type FROM attributes';
    const result = await db.query(query);
    return result.rows.reduce((catalog, attr) => {
      catalog[attr.name] = attr.data_type;
      return catalog;
    }, {});
  }

  static async validateRuleAgainstCatalog(ast) {
    const catalog = await this.getAttributeCatalog();
    this.validateAstNode(ast, catalog);
  }

  static validateAstNode(node, catalog) {
    if (node.type === 'operand' && !(node.value in catalog)) {
      throw new Error(`Invalid attribute: ${node.value} not in catalog`);
    }
    if (node.left) this.validateAstNode(node.left, catalog);
    if (node.right) this.validateAstNode(node.right, catalog);
  }

  static async modifyRule(id, modifications) {
    const rule = await this.getRuleById(id);
    const ast = this.jsonToAst(rule.ast_json);
    
    this.applyModifications(ast, modifications);
    
    const updatedRuleString = this.astToString(ast);
    await this.validateRuleAgainstCatalog(ast);
    
    const query = `
      UPDATE rules 
      SET rule_string = $1, ast_json = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const values = [updatedRuleString, JSON.stringify(ast), id];
    const result = await db.query(query, values);
    
    return result.rows[0];
  }

  static applyModifications(ast, modifications) {
    if (modifications.operator) {
      ast.value = modifications.operator;
    }
    if (modifications.operand) {
      ast.value = modifications.operand;
    }
    if (modifications.left) {
      this.applyModifications(ast.left, modifications.left);
    }
    if (modifications.right) {
      this.applyModifications(ast.right, modifications.right);
    }
    if (modifications.newNode) {
      const newNode = this.parseRule(modifications.newNode);
      if (!ast.left) {
        ast.left = newNode;
      } else if (!ast.right) {
        ast.right = newNode;
      } else {
        throw new Error('Cannot add new node: both left and right are occupied');
      }
    }
  }

  static async createRule(name, condition) {
    try {
      const query = 'INSERT INTO rules (name, condition) VALUES (?, ?)';
      const result = await db.run(query, [name, condition]);
      return { id: result.id, name, condition };
    } catch (error) {
      console.error('Error in RuleService.createRule:', error);
      throw error;
    }
  }

  static async createRule(ruleData) {
    const rules = await this.loadRules();
    const newRule = {
      id: Date.now().toString(),
      ...ruleData
    };
    rules.push(newRule);
    await this.saveRules(rules);
    return newRule;
  }

  static async combineRules(ruleIds) {
    try {
      const rulesToCombine = await Promise.all(ruleIds.map(id => this.getRuleById(id)));
      const combinedAst = this.combineAsts(rulesToCombine.map(rule => this.parseRule(rule.ruleString)));
      const combinedRuleString = this.astToString(combinedAst);
      return { ruleString: combinedRuleString, ast: combinedAst };
    } catch (error) {
      console.error('Error in combineRules:', error);
      throw error;
    }
  }

  static async evaluateRule(ruleId, data) {
    try {
      const rule = await this.getRuleById(ruleId);
      if (!rule) {
        throw new Error(`Rule with id ${ruleId} not found`);
      }
      console.log('Evaluating rule:', rule);
      const ast = this.parseRule(rule.ruleString);
      console.log('Parsed AST:', ast);
      const result = this.evaluateAst(ast, data);
      console.log('Evaluation result:', result);
      return result;
    } catch (error) {
      console.error('Error in evaluateRule:', error);
      throw error;
    }
  }

  static async loadRules() {
    try {
      const data = await fs.readFile(RULES_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return an empty array
        return [];
      }
      throw error;
    }
  }

  static async saveRules(rules) {
    await fs.writeFile(RULES_FILE, JSON.stringify(rules, null, 2));
  }
}

module.exports = RuleService;
