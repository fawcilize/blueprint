const t = require("@babel/types");
const globals = require("globals");

class FileHandler {
  static async findMember(node, name) {
    if (node.currentScope.declarations.module.exports[name]) {
      return node.currentScope.declarations.module.exports[name];
    }
  }

  static async traverse(traverser, context) {
    const { node } = context;
    context.declarations = {
      ...globals.builtin,
      ...globals.commonjs,
      module: {
        exports: {}
      },
      console: {
        log: {
          type: "console.log"
        }
      }
    };

    const child = await traverser.traverse(node.program, context);
    context.children = [child];
    return context;
  }
}

class ProgramHandler {
  static async traverse(traverser, context) {
    const { node } = context;

    context.children = [];
    context.declarations = {};

    for (let i = 0; i < node.body.length; i += 1) {
      const bodyNode = node.body[i];
      if (!t.isDeclaration(bodyNode)) {
        continue;
      }

      const declarations = await traverser.getDeclarationsByName(bodyNode);

      if (declarations) {
        context.declarations = { ...context.declarations, ...declarations };
      }
    }

    for (let i = 0; i < node.body.length; i += 1) {
      const bodyNode = node.body[i];
      const child = await traverser.traverse(bodyNode, context);
      context.children.push(child);
    }

    return context;
  }
}

class VariableDeclarationHandler {
  static resolveInit(init) {
    if (t.isCallExpression(init)) {
    }
  }

  static async getDeclarationsByName(traverser, { node }) {
    return node.declarations.reduce((declarations, declaration) => {
      declarations[declaration.id.name] = null;
      return declarations;
    }, {});
  }

  static async traverse(traverser, context) {
    const { node } = context; // TODO evaluator instead?

    for (let i = 0; i < node.declarations.length; i += 1) {
      const declarationNode = node.declarations[i];
      // TODO type not variable declarator?
      if (t.isIdentifier(declarationNode.id)) {
        const name = declarationNode.id.name;
        const result = await traverser.evaluate(declarationNode.init, context);
        traverser.setDeclarationValue(name, result);
      }
    }

    return context;
  }
}

class VariableDeclaratorHandler {}

class CallExpressionHandler {
  static async findDeclaration(traverser, context) {
    const { node } = context;
    const callee = node.callee;
    if (t.isIdentifier(callee, { name: "require" })) {
      const ast = await traverser.traverseFile(
        context.workingDirectory,
        node.arguments[0].value
      );

      // TODO combine with import/export
      return ast;
    }
  }

  static async evaluate(traverser, context) {
    const declaration = await this.findDeclaration(traverser, context);
    return traverser.evaluate(declaration, context);
  }

  static async traverse(traverser, context) {
    const { node } = context;
    const declaration = await traverser.findDeclaration(node.callee);
    const codePath = await traverser.traverse(declaration);

    return { node, codePath };
  }
}

class ExpressionStatementHandler {
  static async traverse(traverser, context) {
    const { node } = context;
    context.children = await traverser.traverse(node.expression, context);
    return context;
  }
}

class AssignmentExpressionHandler {
  static async traverse(traverser, context) {
    const { node } = context;
    const leftName = traverser.getName(node.left);
    const ownerContext = await traverser.findOwner(node.left);
    await traverser.setProperty(ownerContext, leftName, node.right);

    return context;
  }
}

class ArrowFunctionExpressionHandler {
  // TODO Handle this differently
  static async traverse(traverser, context) {
    const { node } = context;
    const bodyNodes = node.body.body;
    const functionContext = {
      ...context,
      node,
      children: [],
      currentScope: {
        declarations: {},
        parentScope: context.currentScope
      }
    };

    for (let i = 0; i < bodyNodes.length; i += 1) {
      const bodyNode = bodyNodes[i];
      const declarations = await traverser.getDeclarationsByName(
        bodyNode,
        functionContext
      );

      if (declarations) {
        functionContext.currentScope.declarations = {
          ...functionContext.currentScope.declarations,
          ...declarations
        };
      }
    }

    for (let i = 0; i < bodyNodes.length; i += 1) {
      const bodyNode = bodyNodes[i];
      functionContext.children.push(
        await traverser.traverse(bodyNode, functionContext)
      );
    }

    return functionContext;
  }
}

class FunctionDeclarationHandler {
  static async getDeclarationsByName(traverser, { node }) {
    return {
      [node.id.name]: null
    };
  }

  static async traverse(traverser, context) {
    const { node } = context;
    const bodyNodes = node.body.body;
    const functionContext = {
      ...context,
      node,
      children: [],
      currentScope: {
        declarations: {},
        parentScope: context.currentScope
      }
    };

    for (let i = 0; i < bodyNodes.length; i += 1) {
      const bodyNode = bodyNodes[i];
      const declarations = await traverser.getDeclarationsByName(
        bodyNode,
        functionContext
      );

      if (declarations) {
        functionContext.currentScope.declarations = {
          ...functionContext.currentScope.declarations,
          ...declarations
        };
      }
    }

    for (let i = 0; i < bodyNodes.length; i += 1) {
      const bodyNode = bodyNodes[i];
      functionContext.children.push(
        await traverser.traverse(bodyNode, functionContext)
      );
    }

    return functionContext;
  }
}

class ImportDeclarationHandler {}

class MemberExpressionHandler {
  static getName(traverser, { node }) {
    return node.property.name;
  }

  static async findOwner(traverser, context) {
    const { node } = context;
    return traverser.findDeclaration(node.object);
  }

  static async findDeclaration(traverser, context) {
    const { node } = context;
    const ownerNode = await traverser.findDeclaration(node.object);
    // const declaration = declaration.findMember(node);
    const declaration = await traverser.findMember(
      ownerNode,
      node.property.name
    );

    return declaration;
  }
}

class IdentifierHandler {
  static getName(traverser, node) {
    return node.name;
  }

  static findOwner(traverser, context) {
    const {
      node: { name }
    } = context;

    let currentContext = context;
    while (currentContext) {
      const declarations = currentContext.declarations;
      if (
        declarations &&
        Object.prototype.hasOwnProperty.call(declarations, name)
      ) {
        return declarations;
      }

      currentContext = currentContext.parentContext;
    }

    throw new Error(`Unable to find owner for: ${name}`);
  }

  static async findDeclaration(traverser, context) {
    const {
      node: { name }
    } = context;

    const owner = await this.findOwner(traverser, context);

    return owner[name];
  }

  static async traverse(context) {
    return context;
  }
}

class ClassDeclarationHandler {}

class ObjectPropertyHandler {
  static async getName(traverser, context) {
    return context.node.key.name;
  }

  static async evaluate(traverser, context) {
    return context;
  }
}

class ObjectExpressionHandler {
  static async findMember(traverser, node, name) {
    return node.properties.find(property => property.key.name === name);
  }

  static async evaluate(traverser, context) {
    context.children = [];
    const properties = context.node.properties;
    for (let i = 0; i < properties.length; i += 1) {
      const property = properties[i];
      const childContext = await traverser.evaluate(property);
      context.children.push(childContext);
    }

    return context;
  }

  static async setProperty(traverser, context, name, value) {
    for (let i = 0; i < context.children.length; i += 1) {
      const child = context.children[i];
      const childName = await traverser.getName(child.node);
      if (childName === name) {
        child.node.value = value;
        return;
      }
    }
  }
}

module.exports = {
  File: FileHandler,
  Program: ProgramHandler,
  FunctionDeclaration: FunctionDeclarationHandler,
  ArrowFunctionExpression: ArrowFunctionExpressionHandler,
  ImportDeclaration: ImportDeclarationHandler,
  MemberExpression: MemberExpressionHandler,
  CallExpression: CallExpressionHandler,
  ExpressionStatement: ExpressionStatementHandler,
  VariableDeclarator: VariableDeclaratorHandler,
  VariableDeclaration: VariableDeclarationHandler,
  ClassDeclaration: ClassDeclarationHandler,
  AssignmentExpression: AssignmentExpressionHandler,
  Identifier: IdentifierHandler,
  ObjectExpression: ObjectExpressionHandler,
  ObjectProperty: ObjectPropertyHandler
};
