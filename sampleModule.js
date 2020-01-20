const nestedImport = {
  nested: {
    testConsole: () => {
      console.log("Found 1");
    }
  }
};

const nestedImport2 = {
  nested: {
    nested2: {
      testConsole: () => {
        console.log("Found 2");
        nestedImport.nested.testConsole();
      }
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

class TestClass {
  constructor() {
    console.log("Found 3");
  }

  memberA() {
    console.log("Found 4");
  }
}

nestedImport2.nested.nested2.testConsole();
const testNestedCallExpression = {
  nested: {
    nested2: nestedImport2.nested.nested2.testConsole()
  }
};

const banana = {
  test: new TestClass()
};
// const testClass = new TestClass();
banana.test.memberA();
