const t = require("@babel/types");

class PathTraverser {
  constructor(treeBuilder) {}
  getChildren(path) {
    const visitorKeys = t.VISITOR_KEYS[path.type];
    return visitorKeys.map(key => path.get(key));
  }

  traverse(path) {
    const children = this.getChildren(path);
    children.forEach(() => {});
  }
}

module.exports = PathTraverser;
