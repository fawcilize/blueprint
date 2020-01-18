const t = require("@babel/types");
const { default: traverse } = require("@babel/traverse");
const PathHandler = require("./handlers/pathHandler");
const callExpression = require("./handlers/callExpression");

const pathHandler = new PathHandler();
pathHandler.addHandler("CallExpression", () => {});

const createAstFromPath = require("./createAstFromPath");

async function processPath(path, callback) {
  const match = await callback(path);

  if (t.isCallExpression(path)) {
    // Find definition
  }
  // If call expression
  //   find definition
  //   if processPath(definition).length > 0
  //     add to valid paths
  // If function declaration
  //   Loop through children
  //     if processPath(child).length > 0
  //       add to valid paths
  // return valid paths
  const children = await visitChildren(path, callback);
  if (match || children.length) {
    return { path, children, match };
  }
}

async function visitChildren(path, callback) {
  let validPaths = [];

  const visitorKeys = t.VISITOR_KEYS[path.type];
  if (visitorKeys) {
    for (let i = 0; i < visitorKeys.length; i += 1) {
      let childPaths = path.get(visitorKeys[i]);

      if (!Array.isArray(childPaths)) {
        const processedPath = await processPath(childPaths, callback);
        if (processedPath) {
          validPaths.push(processedPath);
        }
        continue;
      }

      for (let j = 0; j < childPaths.length; j += 1) {
        const childPath = childPaths[j];
        if (childPath.type) {
          const processedPath = await processPath(childPath, callback);
          if (processedPath) {
            validPaths.push(processedPath);
          }
        }
      }
    }
  }

  return validPaths;
}

async function printNode(treeNode) {
  console.log(
    treeNode.path.type,
    treeNode.path.scope.block.loc.start,
    treeNode.match
  );

  if (treeNode.children) {
    console.group();
    treeNode.children.forEach(child => {
      printNode(child);
    });
    console.groupEnd();
  }
}

async function asyncTraverse(path, callback) {
  const result = await processPath(path, callback);
  if (result) {
    printNode(result);
  }
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
  const output = await createAstFromPath("./sampleModule.js");

  traverse(output, {
    enter(path) {
      if (path.type === "Program") {
        path.stop();
        asyncTraverse(path, isConsoleLog);
      }
    }
  });
}

entry();
