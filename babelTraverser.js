const t = require("@babel/types");
const path = require("path");
const createAstFromPath = require("./createAstFromPath");
const handlers = require("./babelHandlers");

class BabelTraverser {
  constructor() {
    this.executions = [];
  }

  async createHandler(node, parentHandler) {
    const Handler = handlers[node.type];
    if (Handler) {
      const handler = new Handler(node, parentHandler, this);
      const children = await this.getChildHandlers(node);
      const declarations = children.reduce((declarations, child) => {
        if (t.isDeclaration(child) && child.getDeclarations) {
          declarations = {
            ...declarations,
            ...child.getDeclarations()
          };
        }

        return declarations;
      }, {});

      if (declarations && Object.keys(declarations).length > 0) {
        console.log(node.type);
      }
      // const declarations = await this.getDeclarations(node);
      return {
        type: node.type,
        children,
        declarations,
        getDeclarations: handler.getDeclarations
      };
    }
  }

  async handle(bodyNode, parentHandler) {
    if (bodyNode.handle) {
      await bodyNode.handle(this, bodyNode, parentHandler);
    }
  }

  getChildren(node, key) {
    return node[key].map(childNode => this.getHandler(childNode));
  }

  async traverse(handler) {
    if (handler.traverse) {
      handler.traverse(this);
    }
  }

  async traverseFile(workingDirectory, modulePath) {
    const ast = await createAstFromPath(workingDirectory, modulePath);
    const handler = await this.createHandler(ast);
    console.log(handler);
    // handler.traverse();
    // Get imports
    // Get exports
    // Get side effects
    //   Follow side effects
  }

  async getChildHandlers(node) {
    const handlers = [];
    const visitorKeys = t.VISITOR_KEYS[node.type];
    if (visitorKeys) {
      for (let i = 0; i < visitorKeys.length; i += 1) {
        let childNodes = node[visitorKeys[i]];
        if (!childNodes) {
          continue;
        }

        if (!Array.isArray(childNodes)) {
          childNodes = [childNodes];
        }

        for (let j = 0; j < childNodes.length; j += 1) {
          const childNode = childNodes[j];
          const handler = await this.createHandler(childNode);
          if (handler) {
            handlers.push(handler);
          }
        }
      }
    }

    return handlers;
  }
}

module.exports = BabelTraverser;
