/**
 * File: postcss.config.js
 * Project: CrisisMap – Multi-Disaster Tracker
 *
 * Purpose:
 * --------
 * Configuration file for PostCSS – used in CrisisMap’s frontend styling pipeline.
 *
 * Responsibilities:
 * - Enables Tailwind CSS and Autoprefixer for modern CSS support.
 * - Processes all CSS files before they’re bundled into the final build.
 * - Ensures consistent cross-browser styling and responsive design behavior.
 *
 * Notes:
 * - Works together with tailwind.config.js and craco.config.js.
 * - Modifications here affect how CSS utilities are compiled during `npm run build`.
 */


module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

