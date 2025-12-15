import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FullyCentered } from './containers';

describe('FullyCentered', () => {
    it('renders children', () => {
        render(
            <FullyCentered>
                <div>Child Content</div>
            </FullyCentered>,
        );
        expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('applies centering classes', () => {
        render(
            <FullyCentered>
                <div data-testid="child">Child</div>
            </FullyCentered>,
        );

        // FullyCentered adds a wrapper div
        // We can find the parent of the child to check classes
        const child = screen.getByTestId('child');
        const container = child.parentElement;

        expect(container).toHaveClass(
            'flex',
            'items-center',
            'justify-center',
            'h-full',
            'w-full',
        );
    });
});
