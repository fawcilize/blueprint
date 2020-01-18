const t = require("@babel/types");

function findDefinition(path) {
  let currentPath = path;
  while (currentPath) {
    const binding = currentPath.scope.bindings[path.node.name];
    if (binding) {
      return binding.path;
    }

    if (!currentPath.parentPath) {
      return;
    }

    currentPath = currentPath.parentPath;
  }
}

module.exports = {
  findDefinition
};
