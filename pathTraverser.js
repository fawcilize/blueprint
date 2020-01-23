const t = require("@babel/types");

class PathTraverser {
  constructor(pathHelper) {
    this.pathHelper = pathHelper;
  }

  async traverseNewExpression(path, options) {
    const callee = path.get("callee");
    const declarationPath = await this.pathHelper.findCalleeDeclaration(
      callee,
      options.workingDirectory
    );

    if (t.isClass(declarationPath)) {
      const classBody = declarationPath.get("body");
      const bodyPaths = classBody.get("body");
      bodyPaths.forEach(bodyPath => {
        if (
          t.isClassMethod(bodyPath) &&
          bodyPath.node.key.name === "constructor"
        ) {
          return this.traverseFunction(bodyPath, options);
        }
      });
    }
  }

  async traverseCallExpression(path, options) {
    const callee = path.get("callee");
    const declarationPath = await this.pathHelper.findCalleeDeclaration(
      callee,
      options.workingDirectory
    );

    if (declarationPath.scope.hasGlobal(declarationPath)) {
      const match = await options.match(path);
      return match ? { path: declarationPath, match } : null;
    }

    if (t.isFunction(declarationPath)) {
      return this.traverseFunction(declarationPath, options);
    }
  }

  async traverse(path, options) {
    if (t.isCallExpression(path)) {
      const declarationPath = await this.pathHelper.findDeclaration(path);
    }

    const children = await this.traverseChildren(path, options);
    return { path, children };
  }

  async traverseBackup(path, options) {
    if (t.isFunction(path)) {
      return;
    }

    if (t.isNewExpression(path)) {
      return this.traverseNewExpression(path, options);
    }

    if (t.isCallExpression(path)) {
      return this.traverseCallExpression(path, options);
    }

    if (t.isVariableDeclaration(path)) {
    }

    const match = await options.match(path);
    const children = await this.traverseChildren(path, options);
    if (match || children.length) {
      return { path, children, match };
    }
  }

  async traverseFunction(path, options) {
    const match = await options.match(path);
    const children = await this.traverseChildren(path, options);
    if (match || children.length) {
      return { path, children, match };
    }
  }

  async traverseChildren(path, options) {
    let validPaths = [];

    const visitorKeys = t.VISITOR_KEYS[path.type];
    if (visitorKeys) {
      for (let i = 0; i < visitorKeys.length; i += 1) {
        let childPaths = path.get(visitorKeys[i]);

        if (!Array.isArray(childPaths)) {
          childPaths = [childPaths];
        }

        for (let j = 0; j < childPaths.length; j += 1) {
          const childPath = childPaths[j];
          if (!childPath.type) {
            continue;
          }

          const processedPath = await this.traverse(childPath, options);
          if (processedPath) {
            validPaths.push(processedPath);
          }
        }
      }
    }

    return validPaths;
  }
}

module.exports = PathTraverser;
