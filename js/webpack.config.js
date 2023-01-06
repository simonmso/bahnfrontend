const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
    mode: 'development',
    plugins: [new ESLintPlugin()],
};
