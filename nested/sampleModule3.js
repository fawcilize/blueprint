module.exports.test = 1;

module.exports = () => {
  console.log("Found it");
};

let test = {
  test2: 1
};

test.test2 = 2;

test = 3;
