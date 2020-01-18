const fs = require("fs");
const babelParser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

function findParentPath(path, ancestorType) {
  let currentPath = path.parentPath;

  do {
    if (currentPath.type === ancestorType) {
      return currentPath;
    }

    currentPath = currentPath.parentPath;
  } while (currentPath);
}

fs.readFile(
  "../contxt-sdk-js/src/request.js",
  //   "../nsight-react/apps/nsight-facility-overview/src/components/AggregateDemand.js",
  "utf-8",
  (error, data) => {
    if (error) {
      throw error;
    }

    const output = babelParser.parse(data, {
      sourceType: "module",
      plugins: ["jsx"]
    });

    traverse(output, {
      enter(path) {
        if (path.isIdentifier({ name: "axios" })) {
          if (path.parent.type === "ImportDefaultSpecifier") {
            path.scope.bindings.axios.referencePaths.forEach(nodePath => {
              if (nodePath.parent.type === "MemberExpression") {
                if (nodePath.parent.property.name === "create") {
                  const assignmentExpression = findParentPath(
                    nodePath.parentPath,
                    "AssignmentExpression"
                  );

                  const memberExpression = assignmentExpression.node.left;
                  const axiosIdentifier = memberExpression.property;
                  console.log(assignmentExpression);
                }
              }
            });
          }
        }
      }
    });
  }
);
