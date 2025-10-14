import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  // Use import.meta.dirname (available in Node.js 20.11.0+)
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/storybook-static/**',
      '**/.storybook/**',
      '**/.vitest/**',
      '**/.playwright/**',
      '**/next-env.d.ts',
    ],
  },

  // Next.js recommended configuration for TypeScript projects
  // This includes next/core-web-vitals and next/typescript
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // Storybook recommended configuration
  ...compat.extends('plugin:storybook/recommended'),

  // Prettier configuration (must be last to override other configs)
  ...compat.extends('prettier'),

  // Custom rules for the entire project
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      // Allow unused variables starting with underscore
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Warn on explicit any usage
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Test files: relax some rules
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'e2e/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Storybook files: relax some rules
  {
    files: ['**/*.stories.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default eslintConfig;
