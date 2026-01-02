import { exec } from 'child_process';
import { promisify, parseArgs } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

export async function main(args?: string[]) {
    // Parse args
    const { values } = parseArgs({
        args: args,
        options: {
            app: { type: 'string' },
            packages: { type: 'string' },
        },
    });

    if (!values.app || !values.packages) {
        console.error(
            'Usage: tsx prepare-apps-for-deploy.ts --app <appName> --packages <pkg1,pkg2,...>',
        );
        process.exit(1);
    }

    const appName = values.app;
    const packages = values.packages.split(',');

    console.log(`Preparing deployment for app: ${appName}`);
    console.log(`Packages to pack: ${packages.join(', ')}`);

    const APP_DIR = path.join(rootDir, 'apps', appName);
    const LIB_DIR = path.join(APP_DIR, 'pkg-lib');

    // Ensure lib dir exists
    await fs.mkdir(LIB_DIR, { recursive: true });

    for (const pkg of packages) {
        let pkgDirName = pkg;
        // If user passes @packages/ui, we map to packages/ui
        if (pkg.startsWith('@packages/')) {
            pkgDirName = pkg.replace('@packages/', 'packages/');
        }
        // If user passes packages/ui, it stays packages/ui

        const PKG_DIR = path.join(rootDir, pkgDirName);

        // Verify directory exists
        try {
            await fs.access(PKG_DIR);
        } catch {
            console.error(`Package directory not found: ${PKG_DIR}`);
            process.exit(1);
        }

        console.log(`Packing ${pkg}...`);

        try {
            await execAsync(
                `npx -y pnpm pack --pack-destination "${LIB_DIR}" --dir "${PKG_DIR}"`,
            );
        } catch (error) {
            console.error(`Failed to pack ${pkg}:`, error);
            process.exit(1);
        }

        const sanitizedPkgName = pkg.replace('@', '').replace('/', '-'); // @packages/ui -> packages-ui
        const targetFile = `${sanitizedPkgName}.tgz`;

        const files = await fs.readdir(LIB_DIR);
        // Find the file that looks like sanitizedPkgName-*.tgz (but careful not to match the targetFile itself if it exists from prev run)
        const packedFiles = files.filter(f => f.startsWith(sanitizedPkgName) && f.endsWith('.tgz') && f !== targetFile);

        if (packedFiles.length === 0) {
            console.error(`No .tgz file found for ${pkg} in ${LIB_DIR}`);
            process.exit(1);
        }

        // Take the last one (newest likely)
        const tgzFile = packedFiles[0];

        const oldPath = path.join(LIB_DIR, tgzFile);
        const newPath = path.join(LIB_DIR, targetFile);

        await fs.rename(oldPath, newPath);
        console.log(`Packed to ${newPath}`);

        console.log(`Updating ${appName} package.json...`);
        try {
            await execAsync(
                `npx -y pnpm --filter ${appName} add ./pkg-lib/${targetFile}`,
                {
                    cwd: APP_DIR,
                },
            );
            console.log(`Successfully added ${pkg} to ${appName}.`);
        } catch (error) {
            console.error(`Failed to add package to ${appName}:`, error);
            process.exit(1);
        }
    }

    console.log('Preparation complete.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main(process.argv.slice(2)).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
