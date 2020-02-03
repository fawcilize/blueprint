const fs = require("fs");
const { default: generate } = require("@babel/generator");

function createCodePath(codePath, x1, y1) {
  const code = generate(codePath.node).code;
  const split = code.split("\n");

  let output = `
    ctx.font = '12px Arial';
    metrics = ctx.measureText(\`${code}\`);
    ctx.fillStyle = '#f0f0f5';
    ctx.fillRect(${x1}, ${y1}, metrics.actualBoundingBoxRight + 8, ${split.length *
    14} + 8);
    ctx.fillStyle = '#000000';
  `;

  for (let i = 0; i < split.length; i += 1) {
    y1 += 14;
    output += `ctx.fillText(\`${split[i]}\`, ${x1} + 4, ${y1});`;
  }

  if (codePath.codePath) {
    for (let i = 0; i < codePath.codePath.length; i += 1) {
      const childPath = codePath.codePath[i];
      output += createCodePath(childPath, x1 + 20, y1 + 48);
    }
  }

  return output;
}

async function createHtml(contextTree) {
  const content = `
    <html>
      <body>
        <canvas id="canvas" width="800" height="600"></canvas>
        <script>
          var canvas = document.getElementById("canvas");
          var ctx = canvas.getContext("2d");
          var metrics;
          ${createCodePath(contextTree.codePath[0], 0, 0)}
        </script>
      </body>
    </html>
  `;

  await fs.promises.writeFile("./output/output.html", content);
}

module.exports = createHtml;
