class Node {
  constructor(type, value = null, left = null, right = null) {
    this.validateType(type);
    this.type = type;
    this.value = value;
    this.left = left;
    this.right = right;

    this.validateNode();
  }

  validateType(type) {
    const validTypes = ['operator', 'operand'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid node type. Expected 'operator' or 'operand', got '${type}'`);
    }
  }

  validateNode() {
    if (this.type === 'operator') {
      if (!this.left || !this.right) {
        throw new Error('Operator nodes must have both left and right children');
      }
      if (!(this.left instanceof Node) || !(this.right instanceof Node)) {
        throw new Error('Left and right children must be Node instances');
      }
    } else if (this.type === 'operand') {
      if (this.left || this.right) {
        throw new Error('Operand nodes should not have children');
      }
      if (this.value === null) {
        throw new Error('Operand nodes must have a value');
      }
    }
  }

  toJSON() {
    return {
      type: this.type,
      value: this.value,
      left: this.left ? this.left.toJSON() : null,
      right: this.right ? this.right.toJSON() : null,
    };
  }

  updateNode(type, value, left, right) {
    if (type) this.validateType(type);
    this.type = type || this.type;
    this.value = value !== undefined ? value : this.value;
    this.left = left || this.left;
    this.right = right || this.right;
    this.validateNode();
  }
}

module.exports = Node;
