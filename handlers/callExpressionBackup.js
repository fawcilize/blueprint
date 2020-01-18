const t = require("@babel/types");
const traverse = require("@babel/traverse");
const Identifier = require("./identifier");

const createAstFromPath = require("../createAstFromPath");

function findCallees(path) {
  const callee = path.get("callee");
  const output = [callee];

  switch (callee.type) {
    case "Identifier":
    case "Import":
      return output;

    case "MemberExpression":
      let currentPath = callee;
      while (t.isMemberExpression(currentPath)) {
        currentPath = currentPath.get("object");
        output.push(currentPath);
      }

      return output;

    default:
      throw new Error(`${path.node.callee.type} is unhandled.`);
  }
}

async function findDefinition(path) {
  const callees = findCallees(path);
  let currentPath = callees.pop();
  if (t.isImport(currentPath)) {
    return Promise.resolve("Unhandled");
  }

  if (t.isIdentifier(currentPath)) {
    if (currentPath.node.name === "require") {
      const modulePath = currentPath.parentPath.get("arguments.0").node.value;
      if (modulePath.startsWith(".")) {
        // TODO Get path prefix from File or Program node?
        const output = await createAstFromPath(`${modulePath}.js`);
        return output;
      }
    }

    const definitionPath = Identifier.findDefinition(currentPath);
    if (t.isVariableDeclarator(definitionPath)) {
      const initPath = definitionPath.get("init");
      if (t.isCallExpression(initPath)) {
        const nestedDefinition = await findDefinition(initPath);
        if (t.isFile(nestedDefinition)) {
          traverse(nestedDefinition, {
            enter(path) {
              if (t.isExportDeclaration(path)) {
                const declarationPath = path.get("declaration");
                if (declarationPath.)
              }
            }
          });
        }
      }
    }
  }
}

module.exports = {
  findCallees,
  findDefinition
};
