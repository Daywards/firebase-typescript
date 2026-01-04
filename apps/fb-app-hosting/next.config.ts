import type { NextConfig } from 'next';

const rootDir = __dirname;
const nextConfig: NextConfig = {
    basePath: '/fb-app-hosting',
    output: 'standalone',
    outputFileTracingRoot: rootDir,
    webpack: (config) => {
        config.snapshot = {
            ...(config.snapshot || {}),
            managedPaths: [/^(.+?[\\/]node_modules[\\/])(?!@packages\/ui)/],
        };

        config.watchOptions = {
            ...(config.watchOptions || {}),
            ignored: ['**/node_modules/!(@packages/ui/**)'],
        };

        return config;
    },
};

export default nextConfig;
