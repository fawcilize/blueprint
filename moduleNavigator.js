const t = require("@babel/types");
const { default: traverse } = require("@babel/traverse");
const PathHandler = require("./handlers/pathHandler");
const CallExpression = require("./handlers/callExpressionBackup");

const pathHandler = new PathHandler();

const createAstFromPath = require("./createAstFromPath");

// pathHandler.addHandler("Identifier", path => {});

// pathHandler.addHandler("BlockStatement", path => {
//   const opts = {
//     enter(path) {
//       pathHandler.handle(path);
//     }
//   };

//   traverse(path.node, opts, path.scope, path.state, path);
// });

// pathHandler.addHandler("Program", path => {
//   //console.log(path.context.opts.enter[0]());
//   //   path.body.forEach(node => {
//   //     console.log(node);
//   //   });
// });
// pathHandler.addHandler("ImportDeclaration", path => {
//   //   if (path.node.source.value === "fs") {
//   //     console.log(path.scope.references);
//   //     console.log(path.scope.bindings);
//   //     console.log(path.scope.bindings.fs.references);
//   //   }
// });

// function findDefinition(path, name) {
//   const binding = path.scope.bindings[name];

//   if (binding && binding.path.type === "FunctionDeclaration") {
//     const opts = {
//       enter(path) {
//         if (path.type === "BlockStatement") {
//           console.log(path.container);
//           // pathHandler.handle(path);
//           return false;
//         }
//       }
//     };

//     traverse(
//       binding.path.node,
//       opts,
//       binding.path.scope,
//       binding.path.state,
//       binding.path
//     );
//   }
// }

// pathHandler.addHandler("CallExpression", path => {
//   if (path.node.callee) {
//     if (path.node.callee.type === "Identifier") {
//       findDefinition(path, path.node.callee.name);
//     }

//     if (path.node.callee.type === "MemberExpression") {
//       console.log(path.get("callee").type);
//       // const opts = {
//       //   enter(path) {
//       //     console.log(path.type, path.node.name);
//       //   }
//       // };

//       // console.log("traverse");
//       // traverse(path.node.callee, opts, path.scope, path.state, path);
//     }
//   }
// });

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

function findAllExports(ast) {
  console.log("Finding exports");
  traverse(ast, {
    enter(path) {
      if (t.isExportDeclaration(path)) {
        pathHandler.handle(path.get("declaration"));
      }
    }
  });
}

// pathHandler.addHandler("FunctionDeclaration", async path => {
//   console.log("Function Declaration:", path.node.id.name);
//   const bodyPath = path.get("body");

//   if (t.isBlock(bodyPath)) {
//     const blockBody = bodyPath.get("body");
//     blockBody.forEach(blockPath => {
//       traverse(
//         blockPath.node,
//         {
//           enter(path) {
//             pathHandler.handle(path);
//           }
//         },
//         blockPath.scope,
//         blockPath.state,
//         blockPath
//       );
//     });
//   }
// });

pathHandler.addHandler("CallExpression", async path => {
  const definitionPath = await CallExpression.findDefinition(path);
  // console.log(definitionPath);
  // const callees = findCallees(path);
  // const lastPath = callees.pop();

  // if (t.isIdentifier(lastPath)) {
  //   if (lastPath.node.name === "require") {
  //     const modulePath = lastPath.parentPath.get("arguments.0").node.value;
  //     if (modulePath.startsWith(".")) {
  //       const output = await createAstFromPath(`${modulePath}.js`);
  //       findAllExports(output);
  //     }
  //     return;
  //   }

  //   const definitionPath = findDefinition(lastPath);

  //   if (t.isFunction(definitionPath)) {
  //     pathHandler.handle(definitionPath);
  //     return;
  //   }

  //   if (t.isVariableDeclarator(definitionPath)) {
  //     console.log("Variable Declarator definition");
  //     const initPath = definitionPath.get("init");
  //     pathHandler.handle(initPath);
  //     return;
  //   }

  //   console.log(definitionPath);
  // }
});

async function entry() {
  const output = await createAstFromPath("./sampleModule.js");

  traverse(output, {
    enter(path) {
      pathHandler.handle(path);
    }
  });
}

entry();
