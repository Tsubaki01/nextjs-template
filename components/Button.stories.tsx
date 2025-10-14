import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './Button';

/**
 * Storybookストーリーのサンプル
 * コンポーネントのビジュアルテストと動作確認
 */

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const WithClick: Story = {
  args: {
    children: 'Clickable Button',
    onClick: () => alert('Button clicked!'),
  },
};

export const LongText: Story = {
  args: {
    children: 'This is a button with very long text content',
  },
};
