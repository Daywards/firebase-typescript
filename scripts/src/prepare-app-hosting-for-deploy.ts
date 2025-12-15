import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const APP_DIR = path.join(rootDir, 'apps/fb-app-hosting');
const PKG_DIR = path.join(rootDir, 'packages/ui');
const LIB_DIR = path.join(APP_DIR, 'pkg-lib');
const PKG_FILE = 'packages-ui.tgz';

export async function main() {
    console.log('Preparing App Hosting deployment...');

    // Ensure lib dir exists
    await fs.mkdir(LIB_DIR, { recursive: true });

    // Pack the UI package
    console.log('Packing @packages/ui...');
    // Note: pnpm pack output path is relative to cwd or specific
    // We run executed command from rootDir for simplicity if possible, but package is in packages/ui
    // pnpm pack --pack-destination <dest> --dir <dir>
    // dest needs to be absolute or relative to where command runs.

    try {
        await execAsync(
            `npx -y pnpm pack --pack-destination "${LIB_DIR}" --dir "${PKG_DIR}"`,
        );
    } catch (error) {
        console.error('Failed to pack UI package:', error);
        process.exit(1);
    }

    // Rename the generated tarball
    const files = await fs.readdir(LIB_DIR);
    const tgzFile = files.find(
        (f) => f.startsWith('packages-ui-') && f.endsWith('.tgz'),
    );

    if (!tgzFile) {
        console.error('No .tgz file found in pkg-lib');
        process.exit(1);
    }

    const oldPath = path.join(LIB_DIR, tgzFile);
    const newPath = path.join(LIB_DIR, PKG_FILE);

    await fs.rename(oldPath, newPath);
    console.log(`Packed to ${newPath}`);

    // Modify package.json
    const packageJsonPath = path.join(APP_DIR, 'package.json');

    console.log(`Updating ${packageJsonPath}...`);

    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    // Replace "workspace:*" with "file:./pkg-lib/packages-ui.tgz"
    // Using Regex to be safe
    const updatedContent = packageJsonContent.replace(
        /"@packages\/ui":\s*"workspace:\*"/,
        `"@packages/ui": "file:./pkg-lib/${PKG_FILE}"`,
    );

    if (packageJsonContent === updatedContent) {
        console.log('No changes made to package.json (already updated?)');
    } else {
        await fs.writeFile(packageJsonPath, updatedContent, 'utf-8');
        console.log('package.json updated.');
    }

    console.log('Preparation complete.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
