const t = require("@babel/types");
const Identifier = require("./identifier");

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

function getName(path) {
  const callees = findCallees(path);
  const names = callees.map(callee => {
    if (t.isIdentifier(callee)) {
      return callee.node.name;
    }

    if (t.isMemberExpression(callee)) {
      return callee.node.property.name;
    }

    if (t.isImport) {
      return "import";
    }

    return "";
  });

  return `${names.reverse().join(".")}()`;
}

async function findDefinition(path) {
  const callees = findCallees(path);
  let currentPath = callees.pop();
  if (t.isIdentifier(currentPath)) {
    const definitionPath = Identifier.findDefinition(currentPath);
    if (definitionPath) console.log(definitionPath.type);
    else console.log(currentPath.node.name);
  }
}

async function handleCallExpression(path) {
  const name = getName(path);
  const treeNode = {
    [name]: {}
  };
  const definitionPath = findDefinition(path);
  //   const nestedCallExpressions = findCallExpresions(definition);
  //   nestedCallExpressions.forEach(expression => {
  //     const nestedName = getName(expression);
  //     treeNode[name][nestedName] = handleCallExpression(callExpression);
  //   });

  return treeNode;
}

async function handler(path) {
  const callTree = await handleCallExpression(path);
  console.log(callTree);
}

module.exports = {
  handler
};
