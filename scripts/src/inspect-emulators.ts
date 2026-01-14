import { fetch } from 'undici';

async function main() {
    const hubHost = process.env.FIREBASE_EMULATOR_HUB || 'localhost:4400';
    const url = `http://${hubHost}/emulators`;

    console.log(`Querying Emulator Hub at: ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('--- Emulator Hub Response ---');
        console.log(JSON.stringify(data, null, 2));
        console.log('-----------------------------');
    } catch (error) {
        console.error('Failed to fetch emulator info:', error);
        process.exit(1);
    }
}

main();
