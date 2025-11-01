/**
 * File: index.js
 * Project: CrisisMap – Multi-Disaster Tracker
 *
 * Purpose:
 * --------
 * Entry point for the React application.
 * - Selects the root DOM element.
 * - Renders the <App /> component inside React.StrictMode.
 * - Ensures that the application is mounted properly.
 *
 * Notes:
 * - This file typically stays small but is critical for bootstrapping the app.
 */


import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";


// Select the root DOM element where the app will mount

const root = ReactDOM.createRoot(document.getElementById("root")); 

// Render the App component inside React.StrictMode
// StrictMode helps identify potential problems during development

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
