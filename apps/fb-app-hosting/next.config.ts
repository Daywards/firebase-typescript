import path from 'path';
import type { NextConfig } from 'next';

const rootDir = __dirname;
const nextConfig: NextConfig = {
    transpilePackages: ['@packages/ui'],
    output: 'standalone',
    outputFileTracingRoot: rootDir,
    webpack: (config) => {
        config.resolve.symlinks = false;
        config.resolve.modules = [path.resolve(rootDir, 'node_modules')];
        return config;
    },
};

export default nextConfig;
