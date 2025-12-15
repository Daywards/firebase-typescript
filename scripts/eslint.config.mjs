import sharedConfig from '@packages/eslint-config';

export default [
    ...sharedConfig,
    {
        files: ['src/**/*.ts'],
    },
];
