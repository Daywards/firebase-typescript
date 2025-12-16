import type { NextConfig } from 'next';

const rootDir = __dirname;
const nextConfig: NextConfig = {
    transpilePackages: ['@packages/ui'],
    output: 'standalone',
    outputFileTracingRoot: rootDir,
    webpack: (config) => {
        config.resolve.symlinks = true;
        return config;
    },
};

export default nextConfig;
