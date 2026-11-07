// ESLint settings for the project.
// "flat config" is the modern ESLint format: one list of rule sets.
// eslint-config-expo gives us the standard React Native and Expo rules,
// including the React Hooks checks.
const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expo,
  {
    // Folders ESLint should not check (generated or installed code).
    ignores: ['dist/*', 'node_modules/*'],
  },
]);
