import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { main } from './verify-app-hosting-rollout.js';

const mocks = vi.hoisted(() => {
    return {
        getClient: vi.fn(),
    };
});

vi.mock('google-auth-library', () => {
    return {
        GoogleAuth: class {
            constructor() {}
            getClient() {
                return mocks.getClient();
            }
        },
    };
});

describe('verify-app-hosting-rollout', () => {
    const NOW = new Date('2024-01-01T12:00:00Z').getTime();

    beforeEach(() => {
        vi.resetAllMocks();
        mocks.getClient.mockReset();
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should verify rollout success', async () => {
        const mockRequest = vi.fn();
        mocks.getClient.mockResolvedValue({
            request: mockRequest,
        });

        // 1 minute ago
        const recentTime = new Date(NOW - 60000).toISOString();

        mockRequest
            .mockResolvedValueOnce({
                data: {
                    rollouts: [
                        {
                            name: 'rollouts/test-rollout-1',
                            createTime: recentTime,
                        },
                    ],
                },
            })
            .mockResolvedValueOnce({
                data: { state: 'PENDING' },
            })
            .mockResolvedValue({
                data: { state: 'SUCCEEDED' },
            });

        const consoleLogSpy = vi
            .spyOn(console, 'log')
            .mockImplementation(() => {});
        const exitSpy = vi
            .spyOn(process, 'exit')
            .mockImplementation((code?: string | number | null | undefined) => {
                throw new Error(`Exit: ${code}`);
            });

        const promise = main([
            '--project',
            'test-project',
            '--location',
            'us-central1',
            '--backend',
            'test-backend',
            '--timeout',
            '20',
        ]).catch((e) => e);

        // Advance timer to trigger polling loop
        await vi.advanceTimersByTimeAsync(11000);
        const result = await promise;
        if (result instanceof Error && !result.message.startsWith('Exit:'))
            throw result;

        expect(mocks.getClient).toHaveBeenCalled();
        expect(mockRequest).toHaveBeenCalledTimes(3);
        expect(exitSpy).toHaveBeenCalledWith(0);
        expect(consoleLogSpy).toHaveBeenCalledWith('Rollout succeeded!');
    });

    it('should fail on timeout or error status', async () => {
        const mockRequest = vi.fn();
        mocks.getClient.mockResolvedValue({ request: mockRequest });

        // 1 minute ago
        const recentTime = new Date(NOW - 60000).toISOString();

        mockRequest
            .mockResolvedValueOnce({
                data: {
                    rollouts: [{ name: 'r1', createTime: recentTime }],
                },
            })
            .mockResolvedValueOnce({
                data: { state: 'FAILED', error: { message: 'Build failed' } },
            });

        const exitSpy = vi
            .spyOn(process, 'exit')
            .mockImplementation((code?: string | number | null | undefined) => {
                throw new Error(`Exit: ${code}`);
            });
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        const promise = main([
            '--project',
            'p',
            '--location',
            'l',
            '--backend',
            'b',
        ]).catch((e) => e);
        await vi.advanceTimersByTimeAsync(11000);

        const result = await promise;
        if (result instanceof Error && !result.message.startsWith('Exit:'))
            throw result;

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Rollout failed'),
        );
    });
});
