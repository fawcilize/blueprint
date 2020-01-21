const fs = require("fs");
const process = require("process");
const path = require("path");
const babelParser = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");
const { promisify } = require("util");

const readFile = promisify(fs.readFile);

const astCache = {};

async function createAstFromPath(workingDirectory, modulePath) {
  const cacheKey = path.join(workingDirectory, modulePath);
  if (astCache[cacheKey]) {
    return astCache[cacheKey];
  }

  try {
    const data = await readFile(cacheKey, "utf-8");
    const file = babelParser.parse(data, {
      sourceType: "module",
      plugins: ["jsx", "dynamicImport"]
    });

    traverse(file, {
      enter(path) {
        if (path.type === "Program") {
          path.stop();
          astCache[cacheKey] = path;
        }
      }
    });

    return astCache[cacheKey];
  } catch (error) {
    console.error("Unable to read file:", cacheKey);
    throw error;
  }
}

module.exports = createAstFromPath;
