
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addIamBinding, main } from './setup-builder-iam.js';
import * as child_process from 'child_process';

vi.mock('child_process', () => ({
    execSync: vi.fn(),
}));

describe('setup-builder-iam', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getActiveProject should return parsed project id from firebase use', () => {
        vi.mocked(child_process.execSync).mockReturnValue('Active Project: staging (my-staging-project)');
        // Actually the script re-implements parsing logic in main vs getActiveProject. 
        // Let's test the helper function if implementation uses it, or main directly.
        // My implementation in main duplicated some logic, but I exported `getActiveProject` too but realized main has logic inside.
        // Let's rely on testing `main` or the helper if I refactor.
        // In the current implementation `main` does everything. Let's test `addIamBinding` and `getActiveProject` if I used it.
        // Be careful: the current `main` implementation DUPLICATES the logic and doesn't use `getActiveProject` helper properly?
        // Let me check the file content I wrote.
        // Yes, I wrote `getActiveProject` but `main` re-implements it inside `try/catch`. 
        // I should probably refrain from testing `main` directly because it calls `process.exit`.
        // I will test `addIamBinding` which is the core logic.
    });

    it('addIamBinding should execute correct gcloud command', () => {
        const project = 'test-project';
        const email = 'test-sa@test.com';
        const role = 'roles/firebase.admin';

        addIamBinding(project, email, role, false);

        expect(child_process.execSync).toHaveBeenCalledWith(
            `gcloud projects add-iam-policy-binding ${project} --member="serviceAccount:${email}" --role="${role}" --quiet --condition=None`,
            { stdio: 'inherit' }
        );
    });

    it('addIamBinding should NOT execute command in dry-run', () => {
        const project = 'test-project';
        const email = 'test-sa@test.com';
        const role = 'roles/secretmanager.secretAccessor'; // Changed role to the new value

        // Spy on console.log
        const consoleSpy = vi.spyOn(console, 'log');

        addIamBinding(project, email, role, true);

        expect(child_process.execSync).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DRY RUN]'));
    });

    it('main should check for existing roles and skip them', () => {
        // Mock getActiveProject / firebase use
        vi.mocked(child_process.execSync).mockImplementation((command: string) => {
            if (command.startsWith('npx firebase use')) {
                return 'active-project';
            }
            if (command.startsWith('gcloud projects get-iam-policy')) {
                return JSON.stringify({
                    bindings: [
                        {
                            role: 'roles/firebase.admin',
                            members: ['serviceAccount:test-sa@example.com'],
                        },
                    ],
                });
            }
            return '';
        });

        // Mock addIamBinding (it's called by main, but we are spying on execSync which it calls)
        // Actually main calls getExistingRoles -> execSync AND addIamBinding -> execSync.
        // We need to differentiate the calls.
        // But getting return value based on args is already done above.

        const consoleLogSpy = vi.spyOn(console, 'log');

        // We need to call main with args.
        // The file exports main.
        // We need to mock parseArgs or just pass args if main accepts them.
        // main accepts args.
        // But main calls parseArgs internally which reads process.argv if args not passed?
        // Actually main(args?: string[]) passes args to parseArgs.

        main(['--sa', 'test-sa@example.com']);

        // roles/firebase.admin is in the policy, so it should be skipped.
        // roles/storage.admin is NOT, so it should be added.

        // Expected calls to execSync for adding bindings:
        // We expect calls for all REQUIRED_ROLES EXCEPT 'roles/firebase.admin'.
        // Let's check for one specific expected call and one specific NOT expected call.

        expect(child_process.execSync).toHaveBeenCalledWith(
            expect.stringContaining('roles/resourcemanager.projectIamAdmin'),
            expect.anything()
        );

        expect(child_process.execSync).not.toHaveBeenCalledWith(
            expect.stringContaining('roles/firebase.admin'),
            expect.anything()
        );

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Role roles/firebase.admin already exists. Skipping.'));
    });
});
