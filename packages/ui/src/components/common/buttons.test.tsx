import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './buttons';

describe('Button', () => {
    it('renders with children', () => {
        render(<Button>Click me</Button>);
        expect(
            screen.getByRole('button', { name: /click me/i }),
        ).toBeInTheDocument();
    });

    it('passes extra props to button element', () => {
        render(<Button disabled>Click me</Button>);
        expect(
            screen.getByRole('button', { name: /click me/i }),
        ).toBeDisabled();
    });
});
