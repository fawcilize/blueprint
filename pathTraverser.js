const t = require("@babel/types");

class PathTraverser {
  constructor(pathHelper) {
    this.pathHelper = pathHelper;
  }

  async traverseNewExpression(path, callback) {
    const callee = path.get("callee");
    const declarationPath = await this.pathHelper.findCalleeDeclaration(callee);

    if (t.isClass(declarationPath)) {
      const classBody = declarationPath.get("body");
      const bodyPaths = classBody.get("body");
      bodyPaths.forEach(bodyPath => {
        if (
          t.isClassMethod(bodyPath) &&
          bodyPath.node.key.name === "constructor"
        ) {
          return this.traverseFunction(bodyPath, callback);
        }
      });
    }
  }

  async traverseCallExpression(path, callback) {
    const callee = path.get("callee");
    const declarationPath = await this.pathHelper.findCalleeDeclaration(callee);

    if (declarationPath.scope.hasGlobal(declarationPath)) {
      return { path: declarationPath, match: await callback(path) };
    }

    if (t.isFunction(declarationPath)) {
      return this.traverseFunction(declarationPath, callback);
    }
  }

  async traverse(path, callback) {
    if (t.isFunction(path)) {
      return;
    }

    if (t.isNewExpression(path)) {
      return this.traverseNewExpression(path, callback);
    }

    if (t.isCallExpression(path)) {
      return this.traverseCallExpression(path, callback);
    }

    const match = await callback(path);
    const children = await this.traverseChildren(path, callback);
    if (match || children.length) {
      return { path, children, match };
    }
  }

  async traverseFunction(path, callback) {
    const match = await callback(path);
    const children = await this.traverseChildren(path, callback);
    if (match || children.length) {
      return { path, children, match };
    }
  }

  async traverseChildren(path, callback) {
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

          const processedPath = await this.traverse(childPath, callback);
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
