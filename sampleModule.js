const nestedImport = {
  nested: {
    testConsole: () => {
      console.log("Found");
    }
  }
};

function test() {
  nestedImport.nested.testConsole();
}

function test4() {
  console.log("Not found");
}

function test3() {
  test();
}

test3();
console.log("Test");
