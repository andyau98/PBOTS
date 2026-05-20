import globals from 'globals';
import pluginJs from '@eslint/js';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.commonjs,
            },
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
        },
    },
    pluginJs.configs.recommended,
    prettierConfig,
    {
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            'prettier/prettier': 'error',
            'no-unused-vars': 'warn',
            'no-console': 'warn',
            quotes: ['error', 'single'],
            semi: ['error', 'always'],
        },
    },
];
