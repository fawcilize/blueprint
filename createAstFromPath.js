const fs = require("fs");
const babelParser = require("@babel/parser");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);

const astCache = {};

async function createAstFromPath(filePath) {
  if (!astCache[filePath]) {
    const data = await readFile(filePath, "utf-8");
    astCache[filePath] = babelParser.parse(data, {
      sourceType: "module",
      plugins: ["jsx", "dynamicImport"]
    });
  }

  return astCache[filePath];
}

module.exports = createAstFromPath;
