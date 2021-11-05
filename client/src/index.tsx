import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fat } from "@fortawesome/pro-thin-svg-icons";
import { fas } from "@fortawesome/pro-solid-svg-icons";
import "./index.css";

library.add(fat, fas);
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
