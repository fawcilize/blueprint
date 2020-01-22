function nested() {
  return {
    nestedFunction: function(argument) {
      console.log(argument);
    }
  };
}

function closure(argument) {
  return () => {
    console.log(argument);
  };
}

function closure2(argument) {
  return argument => {
    console.log(argument);
  };
}

function test(argument) {
  console.log(argument);
}

function recursion(count) {
  if (count === 0) {
    console.log("Done!");
    return;
  }

  recursion(count - 1);
}

test.apply(null, [1]);
test.call(null, [2]);
test.bind(null, [3])();
const test2 = test.bind(null, [4]);
test2();
nested.nestedFunction(1);
(function immediatelyInvoked(argument) {
  console.log(argument);
})(1);

closure(1)();
closure(1)(2);

const arrayTest = [test(), nested()];
arrayTest[1]();

arrayTest.map(arrayMember => {
  console.log(arrayMember);
});

recursion(5);

const assignment = argument => {
  console.log(argument);
};

const object = {
  nested: test2,
  nestedFurther: {
    nested: argument => {
      console.log(argument);
    }
  }
};

assignment(10);

object.nested(1);
object.nestedFurther.nested(1);

function outer() {
  function inner(argument) {
    test2(argument);
    console.log(argument);
  }

  inner("outer");
}

outer();

function outer(argument) {
  const inner = () => {
    console.log(argument);
  };

  inner();
}

const undefinedVariable = outer(1);

class Test {
  constructor() {
    console.log("constructor");
  }

  memberA() {
    console.log("memberA");
  }

  test = () => {
    return () => {
      console.log("test class member");
    };
  };
}

const testClass = new Test();
testClass.memberA();
testClass.test()();

const assignmentLater = {};
assignmentLater.test = argument => {
  console.log(argument);
};

assignmentLater.test(1);

const weirdAssignment = {
  ["test"]: argument => {
    console.log(argument);
  }
};

const weirdMerge = {
  test: argument2 => {
    console.log("well actually");
  },
  test2: () => {
    console.log("weird merge");
  }
};

weirdAssignment.test(1);

const result = Object.assign({}, weirdAssignment, weirdMerge);
result.test();
result.test2();

const wtf = {
  enter(argument) {
    console.log(argument);
  }
};

wtf.enter(1);

const callback = callback => {
  callback();
};

callback(x => console.log(x));

const object = {
  call: (argument, argument2) => {
    console.log(argument, argument2);
  }
};

object.call("argument", "argument2");

// generators
// new functions

// const {
//   testConsole,
//   default: defaultImport
// } = require("./nested/sampleModule2");
// testConsole();
// const nestedImport = {
//   nested: {
//     testConsole: () => {
//       console.log("Found 1");
//     }
//   }
// };

// const nestedImport2 = {
//   nested: {
//     nested2: {
//       testConsole: () => {
//         console.log("Found 2");
//         nestedImport.nested.testConsole();
//       }
//     }
//   }
// };

// function test() {
//   nestedImport.nested.testConsole();
// }

// function test4() {
//   console.log("Not found");
// }

// function test3() {
//   test();
// }

// class TestClass {
//   constructor() {
//     console.log("Found 3");
//   }

//   memberA() {
//     console.log("Found 4");
//   }
// }

// nestedImport2.nested.nested2.testConsole();
// const testNestedCallExpression = {
//   nested: {
//     nested2: nestedImport2.nested.nested2.testConsole()
//   }
// };

// const banana = {
//   test: new TestClass()
// };
// // const testClass = new TestClass();
// banana.test.memberA();
