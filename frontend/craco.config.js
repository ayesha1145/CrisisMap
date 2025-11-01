/**
 * File: craco.config.js
 * Project: CrisisMap – Multi-Disaster Tracker
 *
 * Purpose:
 * --------
 * Custom configuration override for Create React App (CRA) using CRACO.
 *
 * Responsibilities:
 * - Integrates Tailwind CSS and PostCSS build steps with the CRA build pipeline.
 * - Simplifies configuration management without ejecting from CRA.
 * - Ensures consistent frontend build settings for CrisisMap.
 *
 * Notes:
 * - CRACO (Create React App Configuration Override) allows fine-tuning Webpack,
 *   Babel, and PostCSS settings while keeping CRA compatibility.
 * - This file works alongside tailwind.config.js and postcss.config.js.
 */


// Load configuration from environment or config file
const path = require('path');

// Environment variable overrides
const config = {
  disableHotReload: process.env.DISABLE_HOT_RELOAD === 'true',
};

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      
      // Disable hot reload completely if environment variable is set
      if (config.disableHotReload) {
        // Remove hot reload related plugins
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
          return !(plugin.constructor.name === 'HotModuleReplacementPlugin');
        });
        
        // Disable watch mode
        webpackConfig.watch = false;
        webpackConfig.watchOptions = {
          ignored: /.*/, // Ignore all files
        };
      } else {
        // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
          ],
        };
      }
      
      return webpackConfig;
    },
  },
};