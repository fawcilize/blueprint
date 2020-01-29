const t = require("@babel/types");
const globals = require("globals");

class FileHandler {
  static async findMember(node, name) {
    if (node.currentScope.declarations.module.exports[name]) {
      return node.currentScope.declarations.module.exports[name];
    }
  }

  static async traverse(node, context) {
    const { traverser } = context;
    const declarations = {
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

    const fileContext = {
      ...context,
      type: "File",
      node,
      children: [],
      currentScope: {
        declarations,
        parentScope: context.currentScope
      }
    };

    const child = await traverser.traverse(node.program, fileContext);
    fileContext.children = [child];

    return fileContext;
  }
}

class ProgramHandler {
  static async traverse(node, context) {
    const { traverser } = context;

    const programContext = {
      ...context,
      node,
      children: [],
      currentScope: {
        declarations: {},
        parentScope: context.currentScope
      }
    };

    for (let i = 0; i < node.body.length; i += 1) {
      const bodyNode = node.body[i];
      const declarations = await traverser.getDeclarationsByName(
        bodyNode,
        programContext
      );

      if (declarations) {
        programContext.currentScope.declarations = {
          ...programContext.currentScope.declarations,
          ...declarations
        };
      }
    }

    for (let i = 0; i < node.body.length; i += 1) {
      const bodyNode = node.body[i];
      const child = await traverser.traverse(bodyNode, programContext);
      programContext.children.push(child);
    }

    return programContext;
  }
}

class VariableDeclarationHandler {
  static resolveInit(init) {
    if (t.isCallExpression(init)) {
    }
  }

  static async getDeclarationsByName(node, context) {
    return node.declarations.reduce((declarations, declaration) => {
      declarations[declaration.id.name] = declaration.init;
      return declarations;
    }, {});
  }

  static async traverse(node, context) {
    const { traverser } = context; // TODO evaluator instead?

    for (let i = 0; i < node.declarations.length; i += 1) {
      const declarationNode = node.declarations[i];
      // TODO type not variable declarator?
      if (t.isIdentifier(declarationNode.id)) {
        const name = declarationNode.id.name;
        const result = await traverser.evaluate(declarationNode.init, context);
        context.currentScope.declarations[name] = result;
      }
    }

    return { node };
  }
}

class VariableDeclaratorHandler {
  static findDeclaration(node) {
    console.log(node.type);
  }

  static evaluate(node, context) {
    const callee = node.callee;
    this.findDeclaration(callee);
  }
}

class CallExpressionHandler {
  static async findDeclaration(node, context) {
    const { traverser } = context;
    const callee = node.callee;
    if (t.isIdentifier(callee) && callee.name === "require") {
      const ast = await traverser.traverseFile(
        context.workingDirectory,
        node.arguments[0].value
      );

      // TODO combine with import/export
      return ast.currentScope.declarations.module.exports;
    }
  }

  static async evaluate(node, context) {
    return this.findDeclaration(node, context);
  }

  static async traverse(node, context) {
    const { traverser } = context;
    const declaration = await traverser.findDeclaration(node.callee, context);
    const callStack = [];
    const childContext = await traverser.traverse(declaration, context);

    return { node, callStack, childContext };
  }
}

class ExpressionStatementHandler {
  static async traverse(node, context) {
    const { traverser } = context;
    return {
      node,
      children: await traverser.traverse(node.expression, context)
    };
  }
}

class AssignmentExpressionHandler {
  static async traverse(node, context) {
    const { traverser } = context;
    const leftName = traverser.getName(node.left);
    const ownerNode = await traverser.findOwner(node.left, context);
    ownerNode[leftName] = node.right;

    return { node };
  }
}

class FunctionDeclarationHandler {
  static async getDeclarationsByName(node, context) {
    return {
      [node.id.name]: node
    };
  }

  static async traverse(node, context) {
    return { node };
  }
}

class ImportDeclarationHandler {}

class MemberExpressionHandler {
  static getName(node) {
    return node.property.name;
  }

  static async findOwner(node, context) {
    const { traverser } = context;
    return traverser.findDeclaration(node.object, context);
  }

  static async findDeclaration(node, context) {
    const { traverser } = context;
    const ownerNode = await traverser.findDeclaration(node.object, context);
    // const declaration = declaration.findMember(node);
    const declaration = await traverser.findMember(
      ownerNode,
      node.property.name
    );

    return declaration;
  }
}

class IdentifierHandler {
  static getName(node) {
    return node.name;
  }

  static findOwner(node, context) {
    let scope = context.currentScope;
    while (scope) {
      if (Object.prototype.hasOwnProperty.call(scope.declarations, node.name)) {
        return scope.declarations;
      }

      scope = scope.parentScope;
    }
  }

  static async findDeclaration(node, context) {
    let scope = context.currentScope;
    while (scope) {
      if (Object.prototype.hasOwnProperty.call(scope.declarations, node.name)) {
        return scope.declarations[node.name];
      }

      scope = scope.parentScope;
    }

    throw new Error(`Unable to find definition for: ${node.name}`);
  }

  static async traverse(node, context) {
    return { node };
  }
}

class ClassDeclarationHandler {}

class ObjectExpressionHandler {
  static async findMember(node, name) {
    return node.properties.find(property => property.key.name === name);
  }

  static async evaluate(node, context) {
    const properties = node.properties;
    for (let i = 0; i < properties.length; i += 1) {
      const property = properties[i];
    }

    return node;
  }
}

module.exports = {
  File: FileHandler,
  Program: ProgramHandler,
  FunctionDeclaration: FunctionDeclarationHandler,
  ImportDeclaration: ImportDeclarationHandler,
  MemberExpression: MemberExpressionHandler,
  CallExpression: CallExpressionHandler,
  ExpressionStatement: ExpressionStatementHandler,
  VariableDeclarator: VariableDeclaratorHandler,
  VariableDeclaration: VariableDeclarationHandler,
  ClassDeclaration: ClassDeclarationHandler,
  AssignmentExpression: AssignmentExpressionHandler,
  Identifier: IdentifierHandler,
  ObjectExpression: ObjectExpressionHandler
};
