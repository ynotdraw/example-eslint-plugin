// From following https://eslint.org/blog/2022/08/new-config-system-part-2/
import { FlatCompat } from '@eslint/eslintrc';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import eslintJs from '@eslint/js';

const flatCompat = new FlatCompat();

export default [
  eslintJs.configs.recommended,
  ...flatCompat.extends('plugin:@typescript-eslint/recommended'),
  prettierConfig,
  {
    ignores: ['dist'],
  },
  {
    rules: {
      'prefer-const': 'error',
    },
  },
  {
    files: ['*.js', '*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
];
