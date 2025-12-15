import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home Page', () => {
    it('renders main heading', () => {
        render(<Home />);
        expect(
            screen.getByRole('heading', {
                level: 1,
                name: /Firebase App Hosting/i,
            }),
        ).toBeInTheDocument();
    });

    it('renders action button', () => {
        render(<Home />);
        expect(
            screen.getByRole('button', { name: /Get Started/i }),
        ).toBeInTheDocument();
    });
});
