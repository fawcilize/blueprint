const t = require("@babel/types");
const path = require("path");
const { default: generator } = require("@babel/generator");
const codeCanvas = require("./codeCanvas");
const fs = require("fs");

const BabelTraverser = require("./babel/babelTraverser");
const babelTraverser = new BabelTraverser();

// async function printNode(treeNode) {
//   const output = generator(treeNode.path.node);

//   if (!t.isBlockStatement(treeNode.path)) {
//     console.log(treeNode.path.type, " - ", treeNode.path.node.loc.start);
//     console.log("--------------------------------------------------");
//     console.group();
//     console.log(output.code);
//     console.groupEnd();
//     console.log("--------------------------------------------------");
//   }

//   if (treeNode.children) {
//     console.group();
//     treeNode.children.forEach(child => {
//       printNode(child);
//     });
//     console.groupEnd();
//   }
// }

async function isConsoleLog(path) {
  if (t.isCallExpression(path)) {
    const callee = path.node.callee;
    if (
      t.isMemberExpression(callee) &&
      t.isIdentifier(callee.object) &&
      t.isIdentifier(callee.property) &&
      callee.object.name === "console" &&
      callee.property.name === "log"
    ) {
      const parameters = path.node.arguments.map(argument => {
        if (t.isStringLiteral) {
          return `"${argument.value}"`;
        }
      });

      return `console.log(${parameters.join(",")})`;
    }
  }
}

async function entry() {
  const output = await babelTraverser.traverseFile(
    __dirname,
    "./nested/sampleModule2"
  );

  fs.writeFileSync(
    path.join(__dirname, "./ui/src/output.json"),
    JSON.stringify(
      output,
      (key, value) => {
        if (key === "parentContext") {
          return;
        }

        return value;
      },
      2
    )
  );
}

entry();
