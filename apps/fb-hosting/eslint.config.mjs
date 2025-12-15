import sharedConfig from '@packages/eslint-config/react';

export default [
    ...sharedConfig,
    {
        ignores: ['dist/**', 'node_modules/**', 'public/**'],
    },
];
