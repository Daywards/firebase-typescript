import { execSync } from 'child_process';
import { parseArgs } from 'util';

import { getActiveProject } from './utils.js';

export { getActiveProject }; // Re-export for potential consumers/tests if needed, or just remove if unused externally


export function serviceAccountExists(project: string, email: string): boolean {
    try {
        // We construct the full email if just the name is passed, but the user receives 'email' as arg.
        // If the user passes just the name 'builder', we should probably construct 'builder@project.iam.gserviceaccount.com'.
        // But the requirements say "accept the service account email as an argument".
        // Let's assume the user passes the full email or we handle the name -> email conversion if it lacks '@'.

        let fullEmail = email;
        if (!email.includes('@')) {
            fullEmail = `${email}@${project}.iam.gserviceaccount.com`;
        }

        const command = `gcloud iam service-accounts describe ${fullEmail} --project=${project} --quiet`;
        execSync(command, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

export function createServiceAccount(
    project: string,
    name: string,
    displayName: string,
    dryRun: boolean = false,
) {
    // The gcloud create command takes a NAME (e.g. 'builder'), not the full email.
    // So if the user passed an email, we need to extract the name part.
    let accountName = name;
    if (name.includes('@')) {
        accountName = name.split('@')[0];
    }

    const command = `gcloud iam service-accounts create ${accountName} --display-name="${displayName}" --project=${project} --quiet`;

    if (dryRun) {
        console.log(`[DRY RUN] ${command}`);
    } else {
        console.log(`Executing: ${command}`);
        execSync(command, { stdio: 'inherit' });
    }
}

export function main(args?: string[]) {
    const { values } = parseArgs({
        args,
        options: {
            sa: { type: 'string' },
            'dry-run': { type: 'boolean' },
        },
    });

    if (!values.sa) {
        console.error(
            'Usage: tsx create-builder-sa.ts --sa <service-account-email-or-name>',
        );
        process.exit(1);
    }

    const saArg = values.sa;
    const dryRun = values['dry-run'] ?? false;

    try {
        const projectId = getActiveProject();
        console.log(`Targeting Project: ${projectId}`);

        let saEmail = saArg;
        if (!saEmail.includes('@')) {
            saEmail = `${saArg}@${projectId}.iam.gserviceaccount.com`;
        }

        console.log(`Service Account Email: ${saEmail}`);

        if (serviceAccountExists(projectId, saEmail)) {
            console.log(`Service account ${saEmail} already exists.`);
        } else {
            console.log(`Creating service account...`);
            createServiceAccount(
                projectId,
                saArg,
                'Cloud Build Service Account',
                dryRun,
            );
        }
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error(String(err));
        }
        process.exit(1);
    }
}

if (process.argv[1] === import.meta.filename) {
    main();
}
