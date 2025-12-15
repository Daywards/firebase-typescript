import type { Meta, StoryObj } from '@storybook/react';
import { FullyCentered } from './containers';

const meta: Meta<typeof FullyCentered> = {
    title: 'Components/Containers/FullyCentered',
    component: FullyCentered,
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
type Story = StoryObj<typeof FullyCentered>;

export const Default: Story = {
    args: {
        children: (
            <div className="p-4 bg-blue-500 text-white rounded shadow-lg">
                I am fully centered!
            </div>
        ),
    },
};
