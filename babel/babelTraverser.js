const path = require("path");
const traversers = require("./traversers");
const createAstFromPath = require("../createAstFromPath");
const t = require("@babel/types");

class BabelTraverser {
  constructor() {}

  createScope() {
    return {
      declarations: {}
    };
  }

  createDescendant(node, parentContext) {
    return {
      codePath: parentContext.codePath,
      scope: parentContext.scope,
      file: parentContext.file,
      node,
      parentContext,
      type: node.type
    };
  }

  createTraverser(parentContext) {
    function call(functionName, nodeOrContext, ...parameters) {
      const traverser = traversers[nodeOrContext.type];
      if (traverser && traverser[functionName]) {
        const context = nodeOrContext.file
          ? nodeOrContext
          : this.createDescendant(nodeOrContext, parentContext);

        const childTraverser = this.createTraverser(context);

        return traverser[functionName].apply(traverser, [
          childTraverser,
          context,
          ...parameters
        ]);
      }

      console.log("Unhandled type:", nodeOrContext.type);
    }

    const findDeclaration = call.bind(this, "findDeclaration");
    const evaluate = call.bind(this, "evaluate");
    const findOwner = call.bind(this, "findOwner");
    const getDeclarationsByName = call.bind(this, "getDeclarationsByName");
    const getName = call.bind(this, "getName");
    const traverse = call.bind(this, "traverse");

    return {
      findDeclaration,
      evaluate,
      findOwner,
      getDeclarationsByName,
      getName,
      traverse,
      traverseFile: this.traverseFile.bind(this),
      createScope: this.createScope.bind(this),
      hasAncestor: function(ancestor) {
        let currentContext = parentContext;
        while (currentContext) {
          if (currentContext === ancestor) {
            return true;
          }

          currentContext = currentContext.parentContext;
        }

        return false;
      },
      getDeclarations: async function(bodyNodes) {
        let declarationsByName = {};

        for (let i = 0; i < bodyNodes.length; i += 1) {
          const bodyNode = bodyNodes[i];

          if (t.isDeclaration(bodyNode)) {
            const declarations = await getDeclarationsByName(bodyNode);
            if (declarations) {
              declarationsByName = {
                ...declarationsByName,
                ...declarations
              };
            }
          }
        }

        return declarationsByName;
      }.bind(this),
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

        return call("findMember", node, name);
      }
    };
  }

  async traverseFile(workingDirectory, modulePath) {
    const ast = await createAstFromPath(workingDirectory, modulePath);
    const fullPath = path.join(workingDirectory, modulePath);
    const context = {
      file: {
        workingDirectory: path.dirname(fullPath),
        modulePath: path.basename(fullPath)
      },
      scope: {}
    };

    const traverser = this.createTraverser(context);
    return traverser.traverse(ast);
  }
}

module.exports = BabelTraverser;
