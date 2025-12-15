import React from 'react';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    level?: HeadingLevel;
    children: React.ReactNode;
}

export function Heading({
    level = 1,
    children,
    className = '',
    ...props
}: HeadingProps) {
    const Tag = `h${level}` as React.ElementType;

    const styles: Record<HeadingLevel, string> = {
        1: 'text-4xl font-bold tracking-tight',
        2: 'text-3xl font-semibold tracking-tight',
        3: 'text-2xl font-semibold',
        4: 'text-xl font-semibold',
        5: 'text-lg font-medium',
        6: 'text-base font-medium',
    };

    const combinedClassName = `${styles[level]} ${className}`.trim();

    return (
        <Tag className={combinedClassName} {...props}>
            {children}
        </Tag>
    );
}
