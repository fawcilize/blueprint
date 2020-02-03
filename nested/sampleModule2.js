// This will fuck it up
testConsole();
function testConsole() {
  const test2 = returnTwo(true);
  console.log(test2);
  // consoleTest();
}

function returnTwo(test2) {
  if (false || test2) {
    return 2;
  } else if (true) {
    return returnTwo(true);
  } else {
    console.log("Dead code");
  }
}
