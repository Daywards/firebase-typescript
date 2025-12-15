export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-enum': [
            2,
            'always',
            [
                'all',
                'build',
                'eslint-config',
                'fb-app-hosting',
                'fb-hosting',
                'root',
                'scripts',
                'ui',
            ],
        ],
    },
};
