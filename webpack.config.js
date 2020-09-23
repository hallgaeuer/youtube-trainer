const path = require('path');

module.exports = {
    mode: 'none',
    entry: './src/content-script.js',
    output: {
        filename: 'content-script.js',
        path: path.resolve(__dirname, 'js'),
    },
    watch: true
};