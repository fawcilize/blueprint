const t = require("@babel/types");
const { default: generator } = require("@babel/generator");
const globals = require("globals");

class GlobalHandler {
  static async traverse(traverser, context) {
    return context;
  }
}

class RecursionHandler {
  static async traverse(traverser, context) {
    return context;
  }
}

class FileHandler {
  static async findMember(node, name) {
    if (node.currentScope.declarations.module.exports[name]) {
      return node.currentScope.declarations.module.exports[name];
    }
  }

  static async traverse(traverser, context) {
    const { node } = context;
    context.scope = traverser.createScope();
    context.scope.declarations = {
      ...globals.builtin,
      ...globals.commonjs,
      module: {
        exports: {}
      },
      console: {
        log: {
          type: "Global"
        }
      }
    };

    context.codePath = [];

    await traverser.traverse(node.program, context);
    return context;
  }
}

class ProgramHandler {
  static async traverse(traverser, context) {
    const { node } = context;

    context.scope = traverser.createScope();
    context.scope.declarations = await traverser.getDeclarations(node.body);

    for (let i = 0; i < node.body.length; i += 1) {
      const bodyNode = node.body[i];
      if (!t.isFunction(bodyNode)) {
        await traverser.traverse(bodyNode, context);
      }
    }

    return context;
  }
}

class VariableDeclarationHandler {
  static resolveInit(init) {
    if (t.isCallExpression(init)) {
    }
  }

  static getDeclarationsByName(traverser, { node }) {
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
        await traverser.traverse(declarationNode.init);
        // const result = await traverser.evaluate(declarationNode.init, context);
        // traverser.setDeclarationValue(name, result);
      }
    }
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
    const { node } = context;
    const declaration = await traverser.findDeclaration(node.callee);
    return await traverser.evaluate(declaration);
  }

  static async traverse(traverser, context) {
    const { node } = context;

    const parentCodePath = context.codePath;
    parentCodePath.push(context);

    const declaration = await traverser.findDeclaration(node.callee);
    if (traverser.hasAncestor(declaration)) {
      context.codePath = [];
      await traverser.traverse({ type: "Recursion" });
      return;
    }

    await traverser.traverse(declaration);
    context.codePath = [declaration];
  }
}

class ExpressionStatementHandler {
  static async traverse(traverser, context) {
    const { node } = context;
    await traverser.traverse(node.expression, context);
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
  static async getDeclarationsByName(traverser, context) {
    const { node } = context;
    const bodyNodes = node.body.body;

    context.scope = traverser.createScope();
    context.scope.declarations = await traverser.getDeclarations(bodyNodes);
    context.codePath = [];

    return {
      [context.node.id.name]: context
    };
  }

  static async evaluate(traverser, context, callArguments) {
    const { node } = context;

    context.scope.declarations = await traverser.getDeclarations(node.body);

    for (let i = 0; i < node.body.body.length; i += 1) {
      const bodyNode = node.body.body[i];
      const output = generator(bodyNode.test);
      const result = eval(output.code);
      await traverser.traverse(bodyNode);
    }
  }

  static async traverse(traverser, context) {
    const { node } = context;

    context.scope.declarations = await traverser.getDeclarations(node.body);

    for (let i = 0; i < node.body.body.length; i += 1) {
      const bodyNode = node.body.body[i];
      await traverser.traverse(bodyNode);
    }
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
      const declarations = currentContext.scope.declarations;
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

class LogicalExpressionHandler {
  static async traverse(traverser, context) {
    const { node } = context;
    await Promise.all([
      traverser.traverse(node.left),
      traverser.traverse(node.right)
    ]);
  }
}

class IfStatementHandler {
  static async traverse(traverser, context) {
    const { node } = context;
    await traverser.traverse(node.test);
    await traverser.traverse(node.consequent);
    if (node.alternate) {
      await traverser.traverse(node.alternate);
    }
  }
}

class BlockStatementHandler {
  static async traverse(traverser, context) {
    const { node } = context;

    for (let i = 0; i < node.body.length; i += 1) {
      await traverser.traverse(node.body[i]);
    }
  }
}

class ReturnStatementHandler {
  static async traverse(traverser, context) {
    const { node } = context;
    await traverser.traverse(node.argument);
  }
}

module.exports = {
  Global: GlobalHandler,
  Recursion: RecursionHandler,
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
  ObjectProperty: ObjectPropertyHandler,
  IfStatement: IfStatementHandler,
  BlockStatement: BlockStatementHandler,
  LogicalExpression: LogicalExpressionHandler,
  ReturnStatement: ReturnStatementHandler
};
