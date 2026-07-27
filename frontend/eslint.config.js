import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import perfectionist from 'eslint-plugin-perfectionist';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import securityPlugin from 'eslint-plugin-security';
import unicornPlugin from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'eslint.config.js']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended, // React Hooks
      reactRefresh.configs.vite, // React Refresh
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json', './tsconfig.playwright.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-dynamic-delete': 'off', // 動的 delete の利用を許可
      '@typescript-eslint/no-invalid-void-type': 'off', // voidを戻り値以外の場所で使うことを許可
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }], // HTML属性（onClickなど）で void 型を返す(Promiseを使用してもエラーにしない)
      '@typescript-eslint/no-non-null-assertion': 'off', // ! を許可する
      'react-refresh/only-export-components': 'off', // 複数エクスポートを許可
    },
    settings: {
      'import/resolver': { node: true, typescript: true }, // import 文のパス解決を Node / TypeScript と同じルールで解釈させる
    },
  },

  // React
  {
    files: ['**/*.{ts,tsx}'],
    ...reactPlugin.configs.flat.recommended,
    rules: {
      'react/react-in-jsx-scope': 'off', // React import 不要
    },
    settings: { react: { version: 'detect' } }, // Reactの自動バージョン検出
  },

  // unicorn(TypeScript/JavaScript のコード品質を高めるルール)
  {
    files: ['**/*.{ts,tsx}'],
    extends: [unicornPlugin.configs.recommended],
    rules: {
      'unicorn/prefer-query-selector': 'off', // document.getElementById より、.querySelector() を使った方が良いという警告をoff
      'unicorn/filename-case': 'off', // ファイル名のルールを無効化
      'unicorn/no-abusive-eslint-disable': 'off', // disableの有効化
      'unicorn/no-array-reduce': 'off', // reduce()の使用を許可
      'unicorn/no-array-sort': 'off', // sort()の使用を許可
      'unicorn/no-null': 'off', // null を使う代わりに undefined を使うルールをoff
      'unicorn/prefer-at': 'off', // 「array[array.length - 1] よりも array.at(-1) を使わせるルールをoff
      'unicorn/prevent-abbreviations': 'off', // 短縮表記を許容する
    },
  },

  // JSXアクセシビリティ
  {
    files: ['**/*.{ts,tsx}'],
    ...jsxA11y.flatConfigs.strict,
    rules: {
      'jsx-a11y/media-has-caption': 'off', // 動画の字幕の提供をoff
    },
  },

  // unusedImports(未使用のインポートを自動検出・削除)
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      // 未使用のインポート、未使用の変数を許容しない。ただし、_ から始まる変数は許容する
      '@typescript-eslint/no-unused-vars': 'off',
      'unicorn/import-style': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          vars: 'all',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  // importPlugin(import 構造チェック)
  {
    files: ['**/*.{ts,tsx}'],
    extends: [importPlugin.flatConfigs.recommended, importPlugin.flatConfigs.typescript],
    rules: {
      'import/no-unresolved': [
        'error',
        {
          ignore: ['^virtual:'],
        },
      ],
    },
  },

  // perfectionist(コードの整理と整列のためのルール)
  {
    files: ['**/*.{ts,tsx}'],
    extends: [perfectionist.configs['recommended-natural']],
    rules: {
      'perfectionist/sort-imports': [
        'error',
        {
          groups: [
            ['builtin', 'external', 'internal'], // recommended-natural と同じ
            ['parent', 'sibling', 'index'], // recommended-natural と同じ
          ],
          newlinesBetween: 0, // 改行をしないようここだけ変更
          type: 'natural', // recommended-natural と同じ
        },
      ],
    },
  },
  // 特定ファイルだけ並べ替えルールをオフ
  {
    files: ['src/theme/**'],
    rules: {
      'perfectionist/sort-interfaces': 'off',
      'perfectionist/sort-keys': 'off',
      'perfectionist/sort-modules': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-objects': 'off',
      'perfectionist/sort-type-literals': 'off',
      'perfectionist/sort-type-unions': 'off',
    },
  },

  // セキュリティ
  {
    files: ['**/*.{ts,tsx}'],
    extends: [securityPlugin.configs.recommended],
    rules: {
      'security/detect-object-injection': 'off', // obj[key]形式の記述を許可
    },
  },

  // Prettier（競合回避）
  {
    extends: [prettierConfig],
  },
]);
