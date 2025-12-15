
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { main, createServiceAccount, serviceAccountExists, getActiveProject } from './create-builder-sa.js';
import * as child_process from 'child_process';

vi.mock('child_process', () => ({
    execSync: vi.fn(),
}));

describe('create-builder-sa', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('getActiveProject should return parsed project id', () => {
        vi.mocked(child_process.execSync).mockReturnValue('Active Project: staging (my-project-id)');
        expect(getActiveProject()).toBe('my-project-id');
    });

    it('getActiveProject should return raw string if no parens', () => {
        vi.mocked(child_process.execSync).mockReturnValue('my-project-id');
        expect(getActiveProject()).toBe('my-project-id');
    });

    it('serviceAccountExists should return true if command succeeds', () => {
        vi.mocked(child_process.execSync).mockReturnValue('');
        expect(serviceAccountExists('proj', 'sa@proj.iam.gserviceaccount.com')).toBe(true);
    });

    it('serviceAccountExists should return false if command fails', () => {
        vi.mocked(child_process.execSync).mockImplementation(() => {
            throw new Error('Not found');
        });
        expect(serviceAccountExists('proj', 'sa@proj.iam.gserviceaccount.com')).toBe(false);
    });

    it('createServiceAccount should extract name from email and run gcloud command', () => {
        createServiceAccount('proj', 'builder@proj.iam.gserviceaccount.com', 'Display Name', false);
        expect(child_process.execSync).toHaveBeenCalledWith(
            expect.stringContaining('gcloud iam service-accounts create builder'),
            expect.anything()
        );
    });

    it('createServiceAccount should respect dryRun', () => {
        const consoleSpy = vi.spyOn(console, 'log');
        createServiceAccount('proj', 'builder', 'Display Name', true);
        expect(child_process.execSync).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DRY RUN]'));
    });

    it('main should create SA if it does not exist', () => {
        // Mock getActiveProject
        vi.mocked(child_process.execSync).mockImplementation((cmd) => {
            if (cmd.startsWith('npx firebase use')) return 'my-project';
            if (cmd.startsWith('gcloud iam service-accounts describe')) throw new Error('Not found'); // SA not found
            return '';
        });

        main(['--sa', 'builder']);

        expect(child_process.execSync).toHaveBeenCalledWith(
            expect.stringContaining('gcloud iam service-accounts create builder'),
            expect.anything()
        );
    });

    it('main should skip creation if SA exists', () => {
        vi.mocked(child_process.execSync).mockImplementation((cmd) => {
            if (cmd.startsWith('npx firebase use')) return 'my-project';
            if (cmd.startsWith('gcloud iam service-accounts describe')) return ''; // SA found
            return '';
        });

        const consoleSpy = vi.spyOn(console, 'log');
        main(['--sa', 'builder']);

        expect(child_process.execSync).not.toHaveBeenCalledWith(
            expect.stringContaining('create'),
            expect.anything()
        );
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'));
    });
});
