const t = require("@babel/types");

class FileHandler {
  async handle(traverser) {
    const handler = traverser.getHandler(this.node.program, this);
    handler.handle(handler);
  }
}

class ProgramHandler {
  constructor(node, parentHandler) {
    this.node = node;
    this.type = node.type;
    this.declarations = {};
    this.parentHandler = parentHandler;
  }

  async findDeclaration(name) {
    return this.declarations[name];
  }

  async findDeclarations(node) {
    const childHandlers = traverser.getChildren(node, "body");
    const declarationNodes = childHandlers.filter(handler =>
      t.isDeclaration(handler)
    );

    for (let i = 0; i < declarationNodes.length; i += 1) {
      const declarationNode = declarationNodes[i];
      await traverser.handle(declarationNode, this);
    }
  }

  async handle(traverser, node, parentHandler) {
    const childHandlers = traverser.getChildren(node, "body");
    const declarationNodes = childHandlers.filter(handler =>
      t.isDeclaration(handler)
    );

    for (let i = 0; i < declarationNodes.length; i += 1) {
      const declarationNode = declarationNodes[i];
      await traverser.handle(declarationNode, this);
    }

    childHandlers.forEach(childNode => {
      traverser.traverse(childNode, this);
    });
  }
}

class FunctionDeclarationHandler {
  constructor(node, parentHandler, handler) {
    this.node = node;
    this.type = node.type;
    this.declarations = {};
    this.handler = handler;
  }

  async getDeclarations() {
    const name = this.node.id ? this.node.id.name : "Anonymous";
    return {
      [name]: this.handler.createHandle(this.node.body)
    };
  }

  async handle(traverser, node, parentHandler) {
    this.node = node;
    const name = node.id ? node.id.name : "Anonymous";

    parentHandler.declarations[name] = this;
    // traverser.traverseChildren(functionDeclaration);
  }
}

class ImportDeclarationHandler {
  constructor(node) {
    this.node = node;
    this.type = node.type;
    this.declarations = {};
  }

  async handle(traverser, node, parentHandler) {
    console.log(node.type);
  }
}

class MemberExpressionHandler {
  constructor(node) {
    this.node = node;
    this.type = node.type;
    this.declarations = {};
  }

  async handle(traverser, node, parentHandler) {
    const name = this.findDeclaration(node);
    console.log(node.type);
  }
}

class CallExpressionHandler {
  constructor(node) {
    this.node = node;
    this.type = node.type;
    this.declarations = {};
  }

  findCalleeName(node, parentHandler) {
    if (t.isIdentifier(node)) {
      return node.name;
    }
  }

  async handle(traverser, node, parentHandler) {
    const name = this.findCalleeName(node.callee);
    if (name) {
      const declaration = await parentHandler.findDeclaration(name);
      console.log(name, ":", declaration.node.type);
    }
  }

  async traverse(traverser) {
    console.log(this.node);
  }
}

class ExpressionStatementHandler {
  constructor(node) {
    this.node = node;
    this.type = node.type;
    // Is this possible?
    this.declarations = {};
  }
  async findDeclaration(name) {
    if (this.declarations[name]) {
      return this.declarations[name];
    }

    return await this.parentHandler.findDeclaration(name);
  }

  async handle(traverser, node, parentHandler) {
    this.parentHandler = parentHandler;
    this.node = node;
    traverser.handle(node.expression, this);
  }
}

class VariableDeclaratorHandler {
  constructor(node) {
    this.node = node;
    this.type = node.type;
    this.declarations = {};
  }

  async handle(traverser, node, parentHandler) {
    // Traverse if reassignment or assigned to a call expression
    parentHandler.declarations[node.id.name] = node.init;
  }
}

class VariableDeclarationHandler {
  constructor(node) {
    this.node = node;
    this.type = node.type;
    this.declarations = {};
  }

  async handle(traverser, node, parentHandler) {
    node.declarations.forEach(declaration => {
      traverser.handle(declaration, parentHandler);
    });
  }
}

class ClassDeclarationHandler {
  constructor(node) {
    this.node = node;
    this.type = node.type;
    this.declarations = {};
  }

  async handle(traverser, node, parentHandler) {
    console.log(node.type);
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
  ClassDeclaration: ClassDeclarationHandler
};
