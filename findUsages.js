function findUsages(ast, node) {}

const fs = require("fs");
const babelParser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

fs.readFile("./sampleModule.js", "utf-8", (error, data) => {
  if (error) {
    throw error;
  }

  const output = babelParser.parse(data, {
    sourceType: "module",
    plugins: ["jsx", "dynamicImport"]
  });

  traverse(output, {
    enter(path) {
      console.log(path);
    }
  });
});
