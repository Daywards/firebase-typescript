
import { execSync } from 'child_process';
import { parseArgs } from 'util';

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
];

export function getActiveProject(): string {
    try {
        const project = execSync('firebase use', { encoding: 'utf-8' }).trim();
        // 'firebase use' output might be "Active Project: my-project", usually it just prints the alias or project id if just 'firebase use' is run?
        // Actually `firebase use` lists aliases. `firebase use --add` etc.
        // `firebase projects:list` might be better or `firebase use` which prints "Active Project: ...".
        // Let's rely on `firebase use` simply printing the active project if we can, or just parse `.firebaserc`.
        // Better yet: `firebase use` without args prints the currently active alias/project.
        // If it returns "Active Project: my-project", we need to parse it.
        // Actually, let's use `gcloud config get-value project` for reliability if we are using gcloud anyway.
        // But the requirement says "as set by `firebase use`".
        // `firebase use` usually prints something like "Active Project: staging (my-staging-project-id)"
        // Let's try to parse the output of `firebase use`.
        return project;
    } catch (error) {
        throw new Error(`Failed to get active project: ${error}`);
    }
}

export function addIamBinding(project: string, serviceAccountEmail: string, role: string, dryRun: boolean = false) {
    const command = `gcloud projects add-iam-policy-binding ${project} --member="serviceAccount:${serviceAccountEmail}" --role="${role}" --quiet --condition=None`;
    if (dryRun) {
        console.log(`[DRY RUN] ${command}`);
    } else {
        console.log(`Executing: ${command}`);
        execSync(command, { stdio: 'inherit' });
    }
}

export function getExistingRoles(project: string, serviceAccountEmail: string): string[] {
    try {
        const command = `gcloud projects get-iam-policy ${project} --format=json`;
        const output = execSync(command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
        const policy = JSON.parse(output);
        const roles: string[] = [];

        if (policy.bindings) {
            for (const binding of policy.bindings) {
                if (binding.members && binding.members.includes(`serviceAccount:${serviceAccountEmail}`)) {
                    roles.push(binding.role);
                }
            }
        }
        return roles;
    } catch (error) {
        console.warn(`Warning: Failed to fetch existing IAM policy: ${error}`);
        return [];
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
        console.error('Usage: tsx setup-builder-iam.ts --sa <service-account-email>');
        process.exit(1);
    }

    const serviceAccountEmail = values.sa;
    const dryRun = values['dry-run'] ?? false;

    // Get active project from firebase
    let activeProjectRaw: string;
    try {
        // We want the actual project ID, not the alias.
        // `firebase use` output: "Active Project: production (case-for-firebase-production)"
        activeProjectRaw = execSync('firebase use', { encoding: 'utf-8' }).trim();
    } catch {
        console.error('Error getting active project. Make sure you have the firebase CLI installed and are in a firebase project directory.');
        process.exit(1);
    }

    // Parse project ID. It might be in parens.
    const match = activeProjectRaw.match(/\(([^)]+)\)/);
    const projectId = match ? match[1] : activeProjectRaw;

    if (!projectId) {
        console.error(`Could not determine active project ID from output: "${activeProjectRaw}"`);
        process.exit(1);
    }

    console.log(`Targeting Project: ${projectId}`);
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
