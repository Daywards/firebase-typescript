import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { main } from './kill-emulator-ports.js';
import fs from 'fs';
import { execSync } from 'child_process';

vi.mock('fs');
vi.mock('child_process');

describe('kill-emulator-ports', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should identify occupied ports and kill them', async () => {
        // Mock firebase.json exists and has content
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
            emulators: {
                auth: { port: 9099 },
                functions: { port: 5001 },
                firestore: { port: 8080 },
                hosting: { port: 5000 },
                ui: { port: 4000 }
            }
        }));

        // Mock execSync behaviors
        vi.mocked(execSync).mockImplementation((command: string) => {
            // Logic to simulate lsof finding a process
            if (command.startsWith('lsof -i:')) {
                // Simulate that port 9099 and 5000 are taken
                if (command.includes('9099') || command.includes('5000')) {
                    return '12345\n';
                }
                // Others, return empty string (unoccupied) or throw error (lsof exit code 1)
                // The real script catches error if lsof fails (no process found)
                throw new Error('Command failed: lsof ...');
            }
            if (command.includes('kill -9')) {
                return '';
            }
            if (command === 'sleep 1') {
                return '';
            }
            return '';
        });

        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });


        await main();

        // Expect finding firebase.json
        expect(fs.readFileSync).toHaveBeenCalled();

        // Expect checkPortRecursive to have called lsof for all ports
        // We defined some ports in mock, verify at least one check
        expect(execSync).toHaveBeenCalledWith(expect.stringContaining('lsof -i:9099'), expect.anything());

        // Expect kill command for occupied ports
        expect(execSync).toHaveBeenCalledWith(expect.stringContaining('lsof -t -i:9099 | xargs kill -9'));
        expect(execSync).toHaveBeenCalledWith(expect.stringContaining('lsof -t -i:5000 | xargs kill -9'));

        // Expect clean up message
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining('%s'),
            expect.stringContaining('Cleaned up ports: 5000, 9099')
        );
    });

    it('should handle no occupied ports gracefully', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false); // No firebase.json, just default ports 3000, 3001

        vi.mocked(execSync).mockImplementation(() => {
            throw new Error('No process found');
        });

        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

        await main();

        expect(consoleLogSpy).toHaveBeenCalledWith('No occupied ports found.');
    });
});
