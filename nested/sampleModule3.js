module.exports.test = 1;

module.exports = () => {
  const test = 1;
  console.log("Found it");
  console.log(test);
};

let test = {
  test2: 1
};

test.test2 = 2;

test = 3;

console.log("Side-effect");
