import React from "react";
import "./App.css";
import codePathTree from "./output.json";
import generate from "@babel/generator";
import styled from "styled-components";

const Container = styled.div`
  padding: 8px;
  margin: 8px;
  display: inline-block;
  text-align: center;
  border: 1px solid #cccccc;
  border-radius: 10px;
`;

const Centered = styled.div`
  display: inline-block;
`;

const Code = styled.div`
  white-space: pre;
  display: inline-block;
  text-align: left;
  background-color: #f0f0f5;
  padding: 8px;
  margin: 8px;
`;

function CodeGraph({ codePath }) {
  const components = [];
  let currentPaths = [codePath];
  while (currentPaths.length > 0) {
    const newPaths = [];
    const newComponents = [];

    currentPaths.forEach(path => {
      if (path.codePath && path.codePath.length > 0) {
        Array.prototype.push.apply(newPaths, path.codePath);
      }

      newComponents.push(<CodePath codePath={path} />);
    });

    components.push(<div>{newComponents}</div>);
    currentPaths = newPaths;
  }

  return <div style={{ display: "flex" }}>{components}</div>;
}

function CodePath({ codePath }) {
  let code = generate(codePath.node).code;

  return (
    <Container>
      <div>{codePath.type}</div>
      {code && (
        <Centered>
          <Code>{code}</Code>
        </Centered>
      )}
    </Container>
  );
}

function App() {
  return (
    <div className="App">
      <CodeGraph codePath={codePathTree} />
    </div>
  );
}

export default App;
