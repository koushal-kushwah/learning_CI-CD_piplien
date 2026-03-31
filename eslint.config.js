import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    rules: {
      // Possible Errors
      'no-console': 'off',  // console.log पर warning दिखाएगा
      'no-debugger': 'warn',  // debugger पर warning

      // Best Practices
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],  // unused variables को error दिखाएगा
      'no-undef': 'error',  // undefined variables को error

      // Stylistic Issues
      'semi': ['error', 'always'],  // semicolon mandatory
      'quotes': ['error', 'single'],  // single quotes mandatory
      'indent': ['warn', 2],  // 2 spaces indentation
      'comma-dangle': ['error', 'always-multiline'],  // trailing commas
      'no-multiple-empty-lines': ['error', { max: 1 }],  // multiple empty lines

      // ES6+
      'arrow-parens': ['error', 'always'],  // arrow function parentheses
      'prefer-const': 'error',  // use const instead of let when possible
      'no-var': 'error',  // no var keyword
    },
  },
  {
    // Ignore files
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**'],
  },
]);