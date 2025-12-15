import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';


// Use vi.hoisted to ensure the mock is available in the factory
const mocks = vi.hoisted(() => {
    return {
        execAsync: vi.fn()
    };
});

// Mock util.promisify to return our execAsyncMock
vi.mock('util', () => ({
    promisify: vi.fn(() => mocks.execAsync),
    default: { promisify: vi.fn(() => mocks.execAsync) }
}));

vi.mock('fs/promises');
vi.mock('child_process');

import { main } from './prepare-app-hosting-for-deploy.js';

describe('prepare-app-hosting', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.execAsync.mockReset();
        mocks.execAsync.mockResolvedValue({ stdout: '', stderr: '' });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should pack the UI package and update package.json', async () => {
        vi.mocked(fs.mkdir).mockResolvedValue(undefined);
        vi.mocked(fs.readdir as unknown as () => Promise<string[]>).mockResolvedValue(['packages-ui-1.0.0.tgz', 'other-file']);
        vi.mocked(fs.rename).mockResolvedValue(undefined);
        vi.mocked(fs.readFile).mockResolvedValue('{"dependencies": {"@packages/ui": "workspace:*"}}');
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);

        await main();

        expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('pkg-lib'), { recursive: true });

        expect(mocks.execAsync).toHaveBeenCalledWith(expect.stringContaining('pnpm pack'));

        expect(fs.readdir).toHaveBeenCalled();
        expect(fs.rename).toHaveBeenCalledWith(
            expect.stringContaining('packages-ui-1.0.0.tgz'),
            expect.stringContaining('packages-ui.tgz')
        );

        expect(fs.readFile).toHaveBeenCalled();
        expect(fs.writeFile).toHaveBeenCalledWith(
            expect.stringContaining('package.json'),
            expect.stringContaining('"@packages/ui": "file:./pkg-lib/packages-ui.tgz"'),
            'utf-8'
        );
    });
});
