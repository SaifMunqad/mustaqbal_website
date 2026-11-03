import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import typescript from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: [
            'vendor/**',
            'node_modules/**',
            'public/**',
            'bootstrap/**',
            'resources/js/actions/**',
            'resources/js/routes/**',
            'resources/js/wayfinder/**',
            '*.cjs',
            'tailwind.config.js',
        ],
    },
    js.configs.recommended,
    reactHooks.configs.flat.recommended,
    ...typescript.configs.recommended,
    {
        ...react.configs.flat.recommended,
        ...react.configs.flat['jsx-runtime'], // Required for React 17+
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/no-unescaped-entities': 'off',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    prettier, // Turn off all rules that might conflict with Prettier
];
