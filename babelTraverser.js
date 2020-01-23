const t = require("@babel/types");
const path = require("path");
const createAstFromPath = require("./createAstFromPath");

class FileHandler {
  constructor(programHandler) {
    this.programHandler = programHandler || new ProgramHandler();
  }

  async process(traverser, node) {
    this.programHandler.process(traverser, node.program);
  }
}

class ProgramHandler {
  constructor() {
    this.declarations = {};
  }

  async process(traverser, node) {
    const childrenByType = await traverser.getChildrenByType(node);

    childrenByType.ClassDeclaration.forEach(classDeclaration => {
      this.declarations[classDeclaration.id.name] = classDeclaration;
    });
    traverser.traverse(childrenByType.Program);
  }
}

class FunctionDeclarationHandler {
  async process(traverser, node, parentNode) {
    const name = node.id ? node.id.name : "Anonymous";

    console.log(name);
    // traverser.traverseChildren(functionDeclaration);
  }
}

class BabelTraverser {
  constructor(pathHelper) {
    this.pathHelper = pathHelper;
    this.declarations = {};
    this.handlers = {
      File: new FileHandler(),
      FunctionDeclaration: new FunctionDeclarationHandler(),
      Program: new ProgramHandler()
    };
  }

  async getChildrenByType(node) {
    const nodesByType = {};
    const visitorKeys = t.VISITOR_KEYS[node.type];
    if (visitorKeys) {
      visitorKeys.forEach(key => {
        const children = Array.isArray(node[key]) ? node[key] : [node[key]];
        children.forEach(child => {
          nodesByType[child.type]
            ? nodesByType[child.type].push(child)
            : (nodesByType[child.type] = [child]);
        });
      });
    }

    return nodesByType;
  }

  async traverse(workingDirectory, modulePath) {
    const ast = await createAstFromPath(workingDirectory, modulePath);
    this.handlers[ast.type].process(this, ast);
    // Get imports
    // Get exports
    // Get side effects
    //   Follow side effects
  }

  async traverseChildren(node) {
    let paths = [];

    const visitorKeys = t.VISITOR_KEYS[node.type];
    if (visitorKeys) {
      for (let i = 0; i < visitorKeys.length; i += 1) {
        let childNodes = node[visitorKeys[i]];

        if (!Array.isArray(childNodes)) {
          childNodes = [childNodes];
        }

        for (let j = 0; j < childNodes.length; j += 1) {
          const childNode = childNodes[j];
          if (!childNode.type) {
            console.log("What?");
            continue;
          }

          if (this.handlers[childNode.type]) {
            await this.handlers[childNode.type].process(this, childNode, node);
          }
        }
      }
    }

    return paths;
  }
}

module.exports = BabelTraverser;
