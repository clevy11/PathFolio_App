import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**', '*.config.*', 'drizzle/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      next: nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
  }
);