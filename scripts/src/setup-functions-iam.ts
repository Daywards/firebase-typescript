import { parseArgs } from 'util';
import { getActiveProject, addIamBinding, getExistingRoles } from './utils.js';

// Roles typically needed for a Firebase Functions Runtime Service Account
// This list can be expanded based on specific function needs.
const REQUIRED_ROLES = [
    'roles/logging.logWriter',
    'roles/artifactregistry.reader',
    'roles/firebase.sdkAdminServiceAgent', // Enables Firebase Admin SDK interactions
    'roles/secretmanager.secretAccessor', // Access secrets
    'roles/iam.serviceAccountTokenCreator', // Create custom tokens
    'roles/pubsub.publisher', // Publish to PubSub
];

export function main(args?: string[]) {
    // Handle help flag manually to avoid parseArgs strict error
    if (args && (args.includes('--help') || args.includes('-h'))) {
        console.log(`
Usage: tsx setup-functions-iam.ts --sa <service-account-email>

Options:
  --sa <email>    The service account email (or name) to setup.
  --dry-run       Print commands without executing.
  --help          Show this help message.
`);
        process.exit(0);
    }

    // Check process.argv if args not provided (when running directly)
    if (!args && process.argv.some(arg => arg === '--help' || arg === '-h')) {
        console.log(`
Usage: tsx setup-functions-iam.ts --sa <service-account-email>

Options:
  --sa <email>    The service account email (or name) to setup.
  --dry-run       Print commands without executing.
  --help          Show this help message.
`);
        process.exit(0);
    }

    const { values } = parseArgs({
        args,
        options: {
            sa: { type: 'string' },
            'dry-run': { type: 'boolean' },
        },
    });

    if (!values.sa) {
        console.error(
            'Usage: tsx setup-functions-iam.ts --sa <service-account-email>',
        );
        process.exit(1);
    }

    const saArg = values.sa;
    const dryRun = values['dry-run'] ?? false;

    let projectId: string;
    try {
        projectId = getActiveProject();
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error(String(err));
        }
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
