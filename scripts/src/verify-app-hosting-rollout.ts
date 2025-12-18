import { GoogleAuth } from 'google-auth-library';
import { parseArgs } from 'util';
import { fileURLToPath } from 'url';

export async function main(args?: string[]) {
    const { values } = parseArgs({
        args,
        options: {
            project: { type: 'string' },
            location: { type: 'string' },
            backend: { type: 'string' },
            timeout: { type: 'string', default: '600' }, // Default 10 minutes
        },
    });

    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    if (!values.project || !values.location || !values.backend) {
        console.error(
            'Usage: tsx verify-app-hosting-rollout.ts --project <PROJECT_ID> --location <LOCATION> --backend <BACKEND_ID>',
        );
        process.exit(1);
    }

    const { project, location, backend } = values;
    const timeoutSeconds = parseInt(values.timeout || '600', 10);
    const client = await auth.getClient();

    const baseUrl = `https://firebaseapphosting.googleapis.com/v1beta/projects/${project}/locations/${location}/backends/${backend}`;

    console.log(`Verifying rollout for ${backend} in ${project}...`);

    // 1. Get the latest rollout
    // Note: orderBy=createTime desc caused a 400 error, so we fetch recent ones and sort client-side.
    const rolloutsUrl = `${baseUrl}/rollouts?pageSize=10`;
    const rolloutRes = await client.request<{
        rollouts?: Array<{ name: string; createTime: string }>;
    }>({ url: rolloutsUrl });
    const rollouts = rolloutRes.data.rollouts;

    if (!rollouts || rollouts.length === 0) {
        console.error('No rollouts found.');
        process.exit(1);
    }

    // Sort by createTime descending to get the latest
    rollouts.sort(
        (a, b) =>
            new Date(b.createTime).getTime() - new Date(a.createTime).getTime(),
    );

    const latestRollout = rollouts[0];
    const rolloutName = latestRollout.name;

    console.log(`Tracking rollout: ${rolloutName}`);

    // 2. Poll for completion
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;

    while (Date.now() - startTime < timeoutMs) {
        const res = await client.request<{ state: string; error?: unknown }>({
            url: `https://firebaseapphosting.googleapis.com/v1beta/${rolloutName}`,
        });
        const rollout = res.data;
        const status = rollout.state;

        console.log(`Rollout status: ${status}`);

        if (status === 'SUCCEEDED') {
            console.log('Rollout succeeded!');
            process.exit(0);
        }

        if (status === 'FAILED' || status === 'CANCELLED') {
            console.error(`Rollout failed with status: ${status}`);
            if (rollout.error) {
                console.error(
                    'Error details:',
                    JSON.stringify(rollout.error, null, 2),
                );
            }
            process.exit(1);
        }

        // Wait 10 seconds before next check
        await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    console.error(
        `Timeout waiting for rollout completion after ${timeoutSeconds} seconds.`,
    );
    process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch((err) => {
        console.error('An error occurred:', err);
        process.exit(1);
    });
}
