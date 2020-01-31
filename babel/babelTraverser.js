const path = require("path");
const traversers = require("./traversers");
const createAstFromPath = require("../createAstFromPath");

class BabelTraverser {
  constructor() {}

  createContext(node, parentContext) {
    return {
      children: [],
      modulePath: parentContext.modulePath,
      node,
      parentContext,
      type: node.type,
      workingDirectory: parentContext.workingDirectory
    };
  }

  createTraverser(parentContext) {
    function call(functionName, node, ...parameters) {
      const traverser = traversers[node.type];
      if (traverser && traverser[functionName]) {
        const context = this.createContext(node, parentContext);
        const childTraverser = this.createTraverser(context);

        return traverser[functionName].apply(traverser, [
          childTraverser,
          context,
          ...parameters
        ]);
      }

      console.log("Unhandled type:", node.type);
    }

    return {
      evaluate: call.bind(this, "evaluate"),
      findDeclaration: call.bind(this, "findDeclaration"),
      findOwner: call.bind(this, "findOwner"),
      getDeclarationsByName: call.bind(this, "getDeclarationsByName"),
      getName: call.bind(this, "getName"),
      traverse: call.bind(this, "traverse"),
      traverseFile: this.traverseFile.bind(this),
      setProperty: (ownerContext, name, value) => {
        const traverser = traversers[ownerContext.type];
        if (traverser && traverser.setProperty) {
          return traverser.setProperty(
            this.createTraverser(ownerContext),
            ownerContext,
            name,
            value
          );
        }
      },
      setDeclarationValue: (name, value) => {
        let context = parentContext;
        while (context) {
          if (
            context.declarations &&
            Object.prototype.hasOwnProperty.call(context.declarations, name)
          ) {
            context.declarations[name] = value;
          }

          context = context.parentContext;
        }
      },
      findMember: (node, name) => {
        if (node[name]) {
          return node[name];
        }

        return this.call("findMember", node, name);
      }
    };
  }

  async traverseFile(workingDirectory, modulePath) {
    const ast = await createAstFromPath(workingDirectory, modulePath);
    const fullPath = path.join(workingDirectory, modulePath);
    const context = {
      workingDirectory: path.dirname(fullPath),
      modulePath
    };

    const traverser = this.createTraverser(context);
    return traverser.traverse(ast);
  }
}

module.exports = BabelTraverser;
