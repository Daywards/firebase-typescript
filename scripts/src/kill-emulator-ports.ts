import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

/**
 * Checks if a port is in use.
 * Returns a promise that resolves to true if the port is in use, false otherwise.
 */
function checkPortRecursive(port: number): Promise<boolean> {
    try {
        // -i:port selects the listing of files any of whose Internet address matches the port
        // -t specifies terse output (process IDs only)
        // - If output is not empty, port is in use.
        const output = execSync(`lsof -i:${port} -t`, {
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore'],
        });

        return Promise.resolve(output.trim().length > 0);
    } catch {
        // lsof returns exit code 1 if no files are found (port not in use)
        return Promise.resolve(false);
    }
}

/**
 * Resolves ports to check from firebase.json and default app ports.
 */
function getPortsToCheck(): number[] {
    const ports = [3000, 3001]; // App ports (e.g., Next.js, React)

    try {
        const firebaseConfigPath = path.resolve(process.cwd(), 'firebase.json');

        if (fs.existsSync(firebaseConfigPath)) {
            const firebaseConfig = JSON.parse(
                fs.readFileSync(firebaseConfigPath, 'utf-8'),
            );
            const emulators = firebaseConfig.emulators || {};

            if (emulators.auth?.port) ports.push(emulators.auth.port);
            if (emulators.functions?.port) ports.push(emulators.functions.port);
            if (emulators.firestore?.port) ports.push(emulators.firestore.port);
            if (emulators.database?.port) ports.push(emulators.database.port);
            if (emulators.hosting?.port) ports.push(emulators.hosting.port);
            if (emulators.pubsub?.port) ports.push(emulators.pubsub.port);
            if (emulators.storage?.port) ports.push(emulators.storage.port);
            if (emulators.ui?.enabled !== false) {
                ports.push(emulators.ui?.port || 4000); // Default UI port
            }
        }
    } catch (error) {
        console.warn(
            'Warning: Failed to read firebase.json for emulator ports.',
            error,
        );
    }

    return [...new Set(ports)].sort((a, b) => a - b);
}

export async function main() {
    console.log('Checking for processes to kill on relevant ports...');

    const portsToCheck = getPortsToCheck();
    const killedPorts: number[] = [];
    const errors: string[] = [];

    for (const port of portsToCheck) {
        if (await checkPortRecursive(port)) {
            console.log(
                `Port ${port} is in use. Attempting to kill process...`,
            );
            try {
                execSync(`lsof -t -i:${port} | xargs kill -9`);
                console.log(`Successfully killed process on port ${port}`);
                killedPorts.push(port);
                // Synchronous wait to allow OS to release port
                execSync('sleep 1');
            } catch (killError: unknown) {
                const message =
                    killError instanceof Error
                        ? killError.message
                        : String(killError);

                console.error(
                    `Failed to kill process on port ${port}:`,
                    message,
                );
                errors.push(`Port ${port}: ${message}`);
            }
        }
    }

    if (killedPorts.length > 0) {
        console.log(
            '\x1b[32m%s\x1b[0m',
            `Cleaned up ports: ${killedPorts.join(', ')}`,
        );
    } else {
        console.log('No occupied ports found.');
    }

    // We don't exit with 1 on kill error necessarily, unless we want to block startup.
    // However, if we failed to kill something blocking a specific port, dev will probably fail.
    if (errors.length > 0) {
        console.error(
            '\x1b[31m%s\x1b[0m',
            'Encountered errors while killing ports:',
        );
        errors.forEach((e) => console.error(e));
        process.exit(1);
    }
}

// Only run main if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}
