import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        // Web/Node.js APIs
        fetch: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        crypto: 'readonly',
        // TypeScript globals
        NodeJS: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      // TypeScript specific rules - relaxed for backend development
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in backend for flexibility
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // General JavaScript/TypeScript rules
      'no-console': 'off', // Allow console.log in backend
      'no-unused-vars': 'off', // Use TypeScript version instead
      'prefer-const': 'warn', // Warn instead of error
      'no-var': 'error',
      'eqeqeq': 'warn',
      
      // Async/await best practices - relaxed
      'require-await': 'warn', // Warn instead of error
      'no-return-await': 'warn', // Warn instead of error
      
      // Import/export
      'no-duplicate-imports': 'warn'
    }
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js',
      'prisma/migrations/**',
      '**/disabled/**',
      'src/routes/disabled/**',
      'src/services/disabled/**',
      'src/scripts/**', // Exclude scripts from strict linting
      'src/**/*.example.ts',
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      'src/index.ts.backup',
      'src/index.cleaned.ts',
      'src/demo-server.ts',
      'src/examples/**'
    ]
  },
  prettierConfig
]
