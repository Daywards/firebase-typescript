import React from 'react';
import { Button, FullyCentered, Heading } from './common';

interface DemoProps {
    headingChildren: React.ReactNode;
    buttonChildren: React.ReactNode;
}

export function Demo({ headingChildren, buttonChildren }: DemoProps) {
    return (
        <FullyCentered>
            <div className="flex flex-col items-center gap-4 text-center">
                <Heading level={1}>{headingChildren}</Heading>
                <Button className="bg-gradient-to-b from-sky-900 to-sky-800">
                    {buttonChildren}
                </Button>
            </div>
        </FullyCentered>
    );
}
