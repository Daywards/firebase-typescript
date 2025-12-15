const rootDir = __dirname;
const nextConfig = {
    transpilePackages: ['@packages/ui'],
    output: 'standalone',
    outputFileTracingRoot: rootDir,
    turbopack: {
        root: rootDir,
    },
};

export default nextConfig;
