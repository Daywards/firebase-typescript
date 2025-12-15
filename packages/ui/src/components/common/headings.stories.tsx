import type { Meta, StoryObj } from '@storybook/react';
import { Heading } from './headings';

const meta: Meta<typeof Heading> = {
    title: 'Components/Heading',
    component: Heading,
    tags: ['autodocs'],
    argTypes: {
        level: {
            control: { type: 'select' },
            options: [1, 2, 3, 4, 5, 6],
        },
    },
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const H1: Story = {
    args: {
        level: 1,
        children: 'Heading Level 1',
    },
};

export const H2: Story = {
    args: {
        level: 2,
        children: 'Heading Level 2',
    },
};

export const H3: Story = {
    args: {
        level: 3,
        children: 'Heading Level 3',
    },
};

export const CustomClass: Story = {
    args: {
        level: 1,
        children: 'Custom Color Heading',
        className: 'text-blue-500',
    },
};
