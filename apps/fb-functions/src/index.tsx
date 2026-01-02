import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { renderToString } from 'react-dom/server';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { Demo } from '@packages/ui';

const require = createRequire(import.meta.url);
const themePath = require.resolve('@packages/ui/theme.css');
const themeCss = fs.readFileSync(themePath, 'utf-8');

export const helloWorld = onRequest((request, response) => {
    logger.info('Hello logs!', { structuredData: true });

    const html = renderToString(
        <html>
            <head>
                <title>Firebase Functions</title>
                <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
                <style
                    type="text/tailwindcss"
                    dangerouslySetInnerHTML={{
                        __html: themeCss,
                    }}
                />
            </head>
            <body>
                <div className="flex h-screen items-center justify-center">
                    <Demo
                        headingChildren="Firebase Functions"
                        buttonChildren="Get Started"
                    />
                </div>
            </body>
        </html>,
    );

    response.send(`<!DOCTYPE html>${html}`);
});
