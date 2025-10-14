import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Button } from './Button';

/**
 * コンポーネントテストのサンプル
 * Reactコンポーネントのテスト例
 */

describe('Button Component', () => {
  it('should render with children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply primary variant classes by default', () => {
    render(<Button>Primary Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-blue-500');
    expect(button).toHaveClass('text-white');
  });

  it('should apply secondary variant classes when specified', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-gray-200');
    expect(button).toHaveClass('text-gray-800');
  });

  it('should handle multiple clicks', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button');

    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(3);
  });
});
