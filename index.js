const t = require("@babel/types");
const path = require("path");
const { default: traverse } = require("@babel/traverse");
const { default: generator } = require("@babel/generator");
const PathHandler = require("./handlers/pathHandler");
const callExpression = require("./handlers/callExpression");
const pathHelper = require("./pathHelper");
const PathTraverser = require("./pathTraverserv2");

const pathTraverser = new PathTraverser(pathHelper);

const BabelTraverser = require("./babel/babelTraverser");
const babelTraverser = new BabelTraverser();

const pathHandler = new PathHandler();
pathHandler.addHandler("CallExpression", () => {});

const createAstFromPath = require("./createAstFromPath");

async function printNode(treeNode) {
  const output = generator(treeNode.path.node);

  if (!t.isBlockStatement(treeNode.path)) {
    console.log(treeNode.path.type, " - ", treeNode.path.node.loc.start);
    console.log("--------------------------------------------------");
    console.group();
    console.log(output.code);
    console.groupEnd();
    console.log("--------------------------------------------------");
  }

  if (treeNode.children) {
    console.group();
    treeNode.children.forEach(child => {
      printNode(child);
    });
    console.groupEnd();
  }
}

async function asyncTraverse(path, { match, workingDirectory }) {
  const result = await pathTraverser.traverse(path, {
    match,
    workingDirectory
  });
  console.log("--------------------------------------------------");
  console.log("Result");
  console.log("--------------------------------------------------");
  if (result) {
    // printNode(result);
  }
  console.log("--------------------------------------------------");
}

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
    "./nested/sampleModule3"
  );
  console.log(output);
  // const programPath = await createAstFromPath(__dirname, "./sampleModule.js");
  // asyncTraverse(programPath, {
  //   match: isConsoleLog,
  //   workingDirectory: __dirname
  // });
}

entry();
