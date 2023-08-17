const path = require('path');

module.exports = {
    entry: './path-to-your-entry-file.js', // Replace with your entry file
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js', // Or your preferred filename
    },
    devtool: false, // Disable source maps for development
    stats: {
      warningsFilter: warning => {
          if (/Failed to parse source map/.test(warning)) {
              return true; // Ignore warnings related to source map parsing
          }
          return false; // Show other warnings
      }
  },
    // Resolver configuration
    resolve: {
        fallback: {
            "path": require.resolve("path-browserify"),
            "fs": false, // 'fs' is not available in the browser so we set it to false
        }
    },

    module: {
      rules: [
        {
            test: /\.js$/,
            use: ["source-map-loader"],
            enforce: "pre",
            exclude: [/node_modules/, /svg2pdf\.js/]
        }
    ]
    },

    // ... any other configuration options you might have.
};
