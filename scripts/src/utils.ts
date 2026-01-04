import { execSync } from 'child_process';

/**
 * Gets the active Firebase project ID from `firebase use`.
 * @throws Error if the active project cannot be determined.
 */
export function getActiveProject(): string {
    let activeProjectRaw: string;
    try {
        // We want the actual project ID, not the alias.
        // `firebase use` output: "Active Project: production (firebase-typescript-production)"
        activeProjectRaw = execSync('npx firebase use', {
            encoding: 'utf-8',
        }).trim();
    } catch {
        throw new Error(
            'Error getting active project. Make sure you have the firebase CLI installed and are in a firebase project directory.',
        );
    }

    // Parse project ID. It might be in parens.
    const match = activeProjectRaw.match(/\(([^)]+)\)/);
    const projectId = match ? match[1] : activeProjectRaw;

    if (!projectId) {
        throw new Error(
            `Could not determine active project ID from output: "${activeProjectRaw}"`,
        );
    }

    return projectId;
}

export function addIamBinding(
    project: string,
    serviceAccountEmail: string,
    role: string,
    dryRun: boolean = false,
) {
    const command = `gcloud projects add-iam-policy-binding ${project} --member="serviceAccount:${serviceAccountEmail}" --role="${role}" --quiet --condition=None`;
    if (dryRun) {
        console.log(`[DRY RUN] ${command}`);
    } else {
        console.log(`Executing: ${command}`);
        execSync(command, { stdio: 'inherit' });
    }
}

export function getExistingRoles(
    project: string,
    serviceAccountEmail: string,
): string[] {
    try {
        const command = `gcloud projects get-iam-policy ${project} --format=json`;
        const output = execSync(command, {
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore'],
        });
        const policy = JSON.parse(output);
        const roles: string[] = [];

        if (policy.bindings) {
            for (const binding of policy.bindings) {
                if (
                    binding.members &&
                    binding.members.includes(
                        `serviceAccount:${serviceAccountEmail}`,
                    )
                ) {
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
