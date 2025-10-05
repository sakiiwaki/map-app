module.exports = {
  root: false,
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  ignorePatterns: ['dist/**/*', 'build/**/*', '.next/**/*']
};
