import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  const mockOnUploadClick = vi.fn();

  it('renders empty state with heading', () => {
    render(<EmptyState onUploadClick={mockOnUploadClick} />);
    expect(screen.getByText('Photo Wallet')).toBeInTheDocument();
  });

  it('renders descriptive text', () => {
    render(<EmptyState onUploadClick={mockOnUploadClick} />);
    expect(
      screen.getByText(/The photos you want with you all the time/i)
    ).toBeInTheDocument();
  });

  it('renders add photo button', () => {
    render(<EmptyState onUploadClick={mockOnUploadClick} />);
    expect(screen.getByText('Add Photos')).toBeInTheDocument();
  });

  it('calls onAddPhoto when button is clicked', () => {
    render(<EmptyState onUploadClick={mockOnUploadClick} />);
    const button = screen.getByTestId('button-add-first-photo');
    fireEvent.click(button);
    expect(mockOnUploadClick).toHaveBeenCalled();
  });

  it('displays wallet icon', () => {
    const { container } = render(<EmptyState onUploadClick={mockOnUploadClick} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('has centered layout classes', () => {
    const { container } = render(<EmptyState onUploadClick={mockOnUploadClick} />);

    const emptyState = container.firstChild;
    expect(emptyState).toHaveClass('flex');
    expect(emptyState).toHaveClass('items-center');
    expect(emptyState).toHaveClass('justify-center');
  });
});

