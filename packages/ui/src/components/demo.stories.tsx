import type { Meta, StoryObj } from '@storybook/react';
import { Demo } from './demo';

const meta: Meta<typeof Demo> = {
    title: 'Components/Demo',
    component: Demo,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => (
            <div style={{ height: '100vh', width: '100vw' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof Demo>;

export const Default: Story = {
    args: {
        headingChildren: 'Hello World',
        buttonChildren: 'Click Me',
    },
};

export const LongText: Story = {
    args: {
        headingChildren: 'This is a much longer heading to see how it wraps',
        buttonChildren: 'Call to Action',
    },
};
