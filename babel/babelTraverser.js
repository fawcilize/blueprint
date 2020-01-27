const path = require("path");
const traversers = require("./traversers");
const createAstFromPath = require("../createAstFromPath");

class BabelTraverser {
  async traverseFile(workingDirectory, modulePath) {
    const ast = await createAstFromPath(workingDirectory, modulePath);
    const fullPath = path.join(workingDirectory, modulePath);
    const context = {
      traverser: this,
      workingDirectory: path.dirname(fullPath),
      modulePath
    };

    return this.traverse(ast, context);
  }

  getName(node) {
    const traverser = traversers[node.type];
    if (traverser && traverser.getName) {
      return traverser.getName(node);
    }
  }

  async findMember(node, name) {
    const traverser = traversers[node.type];
    if (traverser && traverser.findMember) {
      return await traverser.findMember(node, name);
    }

    if (node[name]) {
      return node[name];
    }
  }

  async getDeclarationsByName(node, context) {
    const traverser = traversers[node.type];
    if (traverser && traverser.getDeclarationsByName) {
      return traverser.getDeclarationsByName(node, context);
    }
  }

  async findOwner(node, context) {
    const traverser = traversers[node.type];
    if (traverser && traverser.findOwner) {
      return traverser.findOwner(node, context);
    }
  }

  findDeclaration(node, context) {
    const traverser = traversers[node.type];
    if (traverser && traverser.findDeclaration) {
      return traverser.findDeclaration(node, context);
    }
  }

  traverse(node, context) {
    const traverser = traversers[node.type];
    if (traverser && traverser.traverse) {
      return traverser.traverse(node, context);
    }
  }

  async evaluate(node, context) {
    const traverser = traversers[node.type];
    if (traverser && traverser.evaluate) {
      await traverser.evaluate(node, context);
    }
  }
}

module.exports = BabelTraverser;
