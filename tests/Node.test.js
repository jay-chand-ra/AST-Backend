const Node = require('../src/models/Node');

describe('Node', () => {
  test('creates a valid operator node', () => {
    const left = new Node('operand', 'age');
    const right = new Node('operand', '30');
    const node = new Node('operator', '>', left, right);
    expect(node.type).toBe('operator');
    expect(node.value).toBe('>');
    expect(node.left).toBe(left);
    expect(node.right).toBe(right);
  });

  test('creates a valid operand node', () => {
    const node = new Node('operand', '30');
    expect(node.type).toBe('operand');
    expect(node.value).toBe('30');
    expect(node.left).toBeNull();
    expect(node.right).toBeNull();
  });

  test('throws error for invalid node type', () => {
    expect(() => new Node('invalid')).toThrow('Invalid node type');
  });

  test('throws error for operator node without children', () => {
    expect(() => new Node('operator', 'AND')).toThrow('Operator nodes must have both left and right children');
  });

  test('throws error for operand node with children', () => {
    const child = new Node('operand', '30');
    expect(() => new Node('operand', '40', child)).toThrow('Operand nodes should not have children');
  });

  test('allows updating node properties', () => {
    const node = new Node('operand', '30');
    node.updateNode('operand', '40');
    expect(node.value).toBe('40');
  });

  test('toJSON method returns correct representation', () => {
    const left = new Node('operand', 'age');
    const right = new Node('operand', '30');
    const node = new Node('operator', '>', left, right);
    const json = node.toJSON();
    expect(json).toEqual({
      type: 'operator',
      value: '>',
      left: { type: 'operand', value: 'age', left: null, right: null },
      right: { type: 'operand', value: '30', left: null, right: null }
    });
  });

  test('updateNode method validates after update', () => {
    const node = new Node('operand', '30');
    expect(() => node.updateNode('operator', 'AND')).toThrow('Operator nodes must have both left and right children');
  });
});
