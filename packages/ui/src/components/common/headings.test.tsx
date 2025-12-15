import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Heading } from './headings';

describe('Heading', () => {
    it('renders with children', () => {
        render(<Heading>Hello World</Heading>);
        expect(
            screen.getByRole('heading', { name: /hello world/i }),
        ).toBeInTheDocument();
    });

    it('renders generic h1 by default', () => {
        render(<Heading>Level 1</Heading>);
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('renders correct heading levels', () => {
        render(<Heading level={2}>Level 2</Heading>);
        expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();

        render(<Heading level={3}>Level 3</Heading>);
        expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();

        render(<Heading level={6}>Level 6</Heading>);
        expect(screen.getByRole('heading', { level: 6 })).toBeInTheDocument();
    });

    it('applies custom className', () => {
        render(<Heading className="custom-class">Custom Class</Heading>);
        const heading = screen.getByRole('heading');

        expect(heading).toHaveClass('custom-class');
        // Should also keep default classes (checking for one of them)
        expect(heading).toHaveClass('font-bold');
    });

    it('passes extra props to heading element', () => {
        render(<Heading data-testid="test-heading">Test</Heading>);
        expect(screen.getByTestId('test-heading')).toBeInTheDocument();
    });
});
