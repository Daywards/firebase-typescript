import { execSync } from 'child_process';
import { parseArgs } from 'util';

import { getActiveProject, addIamBinding, getExistingRoles } from './utils.js';

const REQUIRED_ROLES = [
    'roles/firebase.admin',
    'roles/serviceusage.serviceUsageAdmin',
    'roles/cloudbuild.builds.editor',
    'roles/iam.serviceAccountUser',
    'roles/run.admin',
    'roles/artifactregistry.admin',
    'roles/storage.admin',
    'roles/logging.logWriter',
    'roles/secretmanager.secretAccessor',
    'roles/iam.serviceAccountCreator',
    'roles/resourcemanager.projectIamAdmin',
    'roles/developerconnect.readTokenAccessor',
    'roles/cloudfunctions.admin',
    'roles/serviceusage.apiKeysViewer',
];

export { getActiveProject, addIamBinding, getExistingRoles };

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
            'Usage: tsx setup-builder-iam.ts --sa <service-account-email>',
        );
        process.exit(1);
    }

    const saArg = values.sa;
    const dryRun = values['dry-run'] ?? false;

    // Get active project from firebase
    let activeProjectRaw: string;
    try {
        // We want the actual project ID, not the alias.
        // `firebase use` output: "Active Project: production (firebase-typescript-production)"
        activeProjectRaw = execSync('npx firebase use', {
            encoding: 'utf-8',
        }).trim();
    } catch {
        console.error(
            'Error getting active project. Make sure you have the firebase CLI installed and are in a firebase project directory.',
        );
        process.exit(1);
    }

    // Parse project ID. It might be in parens.
    const match = activeProjectRaw.match(/\(([^)]+)\)/);
    const projectId = match ? match[1] : activeProjectRaw;

    if (!projectId) {
        console.error(
            `Could not determine active project ID from output: "${activeProjectRaw}"`,
        );
        process.exit(1);
    }

    console.log(`Targeting Project: ${projectId}`);

    let serviceAccountEmail = saArg;
    if (!serviceAccountEmail.includes('@')) {
        serviceAccountEmail = `${saArg}@${projectId}.iam.gserviceaccount.com`;
    }

    console.log(`Service Account: ${serviceAccountEmail}`);

    const existingRoles = getExistingRoles(projectId, serviceAccountEmail);
    console.log(`Existing roles: ${existingRoles.join(', ')}`);

    for (const role of REQUIRED_ROLES) {
        if (existingRoles.includes(role)) {
            console.log(`Role ${role} already exists. Skipping.`);
            continue;
        }
        addIamBinding(projectId, serviceAccountEmail, role, dryRun);
    }
}

if (process.argv[1] === import.meta.filename) {
    main();
}
