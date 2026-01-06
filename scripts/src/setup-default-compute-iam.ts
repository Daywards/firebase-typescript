import { execSync } from 'child_process';
import { parseArgs } from 'util';

import { getActiveProject, addIamBinding, getExistingRoles } from './utils.js';

const REQUIRED_ROLES = [
    'roles/cloudfunctions.admin',
    'roles/iam.serviceAccountUser',
];

export function main(args?: string[]) {
    const { values } = parseArgs({
        args,
        options: {
            'dry-run': { type: 'boolean' },
        },
    });

    const dryRun = values['dry-run'] ?? false;

    let projectId: string;
    try {
        projectId = getActiveProject();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }

    console.log(`Targeting Project: ${projectId}`);

    // Get Project Number
    let projectNumber: string;
    try {
        const output = execSync(
            `gcloud projects describe ${projectId} --format="value(projectNumber)"`,
            {
                encoding: 'utf-8',
            },
        ).trim();
        projectNumber = output;
    } catch {
        console.error('Error getting project number via gcloud.');
        process.exit(1);
    }

    console.log(`Project Number: ${projectNumber}`);

    const serviceAccountEmail = `${projectNumber}-compute@developer.gserviceaccount.com`;
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
