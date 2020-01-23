const t = require("@babel/types");

class PathTraverser {
  constructor(pathHelper) {
    this.pathHelper = pathHelper;
  }

  async traverse(path, options) {
    if (t.isCallExpression(path)) {
      const declarationPath = await this.pathHelper.findDeclaration(path);
    }

    const children = await this.traverseChildren(path, options);
    return { path, children };
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
