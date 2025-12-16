import type { NextConfig } from 'next';

const rootDir = __dirname;
const nextConfig: NextConfig = {
    transpilePackages: ['@packages/ui'],
    output: 'standalone',
    outputFileTracingRoot: rootDir,
    webpack: (config) => {
        config.resolve.symlinks = true;

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
