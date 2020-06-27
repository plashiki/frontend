module.exports = {
    root: true,
    env: {
        node: true,
        browser: true,
    },
    extends: [
        'plugin:vue/essential',
        'eslint:recommended',
        '@vue/typescript/recommended',
    ],
    parserOptions: {
        ecmaVersion: 2020,
    },
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        indent: ['error', 4, {
            SwitchCase: 0,
        }],
        'vue/html-indent': ['error', 4],
        'vue/attributes-order': 'error',
        '@typescript-eslint/member-naming': ['error', {
            'private': '^_',
            'protected': '^_',
        }],
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/member-delimiter-style': ['error', {
            multiline: {
                delimiter: 'none',
            },
            singleline: {
                delimiter: 'comma',
            },
        }],
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-constant-condition': 'off',
        'prefer-const': 'off',
        'require-atomic-updates': 'off',
        'no-var': 'error',
        '@typescript-eslint/ban-ts-ignore': 'off',
        'vue/no-v-html': 'off',
        '@typescript-eslint/no-this-alias': 'off',
    },
    overrides: [
        {
            files: [
                '**/__tests__/*.{j,t}s?(x)',
                '**/tests/unit/**/*.spec.{j,t}s?(x)',
            ],
            env: {
                mocha: true,
            },
        },
    ],
    ignorePatterns: [
        'src/vendor/**/*',
        'public/**/*',
        '**/*.js',
    ],
}
