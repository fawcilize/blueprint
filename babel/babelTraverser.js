const path = require("path");
const traversers = require("./traversers");
const createAstFromPath = require("../createAstFromPath");

class BabelTraverser {
  constructor() {
    this.getName = this.call.bind(this, "getName");
    this.getDeclarationsByName = this.call.bind(this, "getDeclarationsByName");
    this.findOwner = this.call.bind(this, "findOwner");
    this.findDeclaration = this.call.bind(this, "findDeclaration");
    this.traverse = this.call.bind(this, "traverse");
    this.evaluate = this.call.bind(this, "evaluate");
  }

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

  call(functionName, node, ...parameters) {
    const traverser = traversers[node.type];
    if (traverser && traverser[functionName]) {
      return traverser[functionName].apply(traverser, [node, ...parameters]);
    }

    console.log("Unhandled:", functionName, node.type);
  }

  findMember(node, name) {
    if (node[name]) {
      return node[name];
    }

    return this.call("findMember", node, name);
  }
}

module.exports = BabelTraverser;
