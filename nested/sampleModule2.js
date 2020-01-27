// const consoleTest from "./sampleModule3";
const consoleTest = require("./sampleModule3");

const y = 2;
const z = 3;

module.exports.nested = {
  testConsole: () => {
    consoleTest();
  }
};

function testConsole() {
  consoleTest();
}

module.exports = { testConsole, y, z };

testConsole();
