const t = require("@babel/types");

async function findCalleeDeclaration(path) {
  if (t.isIdentifier(path)) {
    const name = path.node.name;

    if (path.scope.getBinding(name)) {
      return path.scope.getBinding(path.node.name).path;
    }

    if (path.scope.hasGlobal(name)) {
      return path;
    }
  }

  if (t.isNewExpression(path)) {
    return await findCalleeDeclaration(path.get("callee"));
  }

  if (t.isVariableDeclarator(path)) {
    return;
  }

  if (t.isObjectExpression(path)) {
    return;
  }

  if (t.isMemberExpression(path)) {
    const objectPath = path.get("object");
    const propertyPath = path.get("property");

    let identifier;
    let declaration = objectPath;
    while (!identifier) {
      declaration = await findCalleeDeclaration(declaration);
      if (declaration === objectPath) {
        return declaration;
      }

      if (!declaration) {
        console.log("No declaration found");
        break;
      }

      // TODO Replace, there could be more than one match
      declaration.traverse({
        Identifier: path => {
          if (path.node.name === propertyPath.node.name) {
            identifier = path;
            path.stop();
          }
        }
      });
    }

    const parentPath = identifier.parentPath;
    if (t.isObjectProperty(parentPath)) {
      return parentPath.get("value");
    }

    if (t.isFunction(parentPath)) {
      return parentPath;
    }

    throw new Error(
      `${propertyPath.node.name} - Unhandled parent type: ${parentPath.type}`
    );
  }

  console.log("Unhandled type:", path.type);
}

module.exports = {
  findCalleeDeclaration
};

// function findCallees(path) {
//   const callee = path.get("callee");
//   const output = [callee];

//   switch (callee.type) {
//     case "Identifier":
//     case "Import":
//       return output;

//     case "MemberExpression":
//       let currentPath = callee;
//       while (t.isMemberExpression(currentPath)) {
//         currentPath = currentPath.get("object");
//         output.push(currentPath);
//       }

//       return output;

//     default:
//       throw new Error(`${path.node.callee.type} is unhandled.`);
//   }
// }

// function getName(path) {
//   const callees = findCallees(path);
//   const names = callees.map(callee => {
//     if (t.isIdentifier(callee)) {
//       return callee.node.name;
//     }

//     if (t.isMemberExpression(callee)) {
//       return callee.node.property.name;
//     }

//     if (t.isImport) {
//       return "import";
//     }

//     return "";
//   });

//   return `${names.reverse().join(".")}()`;
// }

// async function findDefinition(path) {
//   const callees = findCallees(path);
//   let currentPath = callees.pop();
//   if (t.isIdentifier(currentPath)) {
//     const definitionPath = Identifier.findDefinition(currentPath);
//     if (definitionPath) console.log(definitionPath.type);
//     else console.log(currentPath.node.name);
//   }
// }
