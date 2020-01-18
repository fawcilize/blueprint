const t = require("@babel/types");
const CallExpression = require("./callExpressionBackup");

async function findValuePath(initPath) {
  if (t.isCallExpression(initPath)) {
    const callees = CallExpression.findCallees(initPath);
    const lastPath = callees.pop();

    if (t.isIdentifier(lastPath, { name: "require" })) {
      const modulePath = lastPath.parentPath.get("arguments.0").node.value;
      if (modulePath.startsWith(".")) {
        // TODO Get path prefix from File or Program node?
        const output = await createAstFromPath(`${modulePath}.js`);
        return output;
      }
    }
  }
}

module.exports = {
  findValuePath
};
