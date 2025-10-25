// @ts-check
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * @type {import('typescript-eslint').Config}
 */
export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
    },
  },

  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-namespace': [
        'error',
        {
          allowDeclarations: true,
        },
      ],
    },
  },

  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      '.pnpm-store/',
      'pnpm-lock.yaml',
    ],
  },

  prettier
);
