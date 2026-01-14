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
                'fb-functions',
                'root',
                'scripts',
                'terraform',
                'ui',
            ],
        ],
    },
};
