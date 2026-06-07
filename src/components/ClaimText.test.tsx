import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ClaimText } from './ClaimText';
import type { Claim } from '@/types';

const base: Claim = {
  id: 'c1',
  text: 'hello world',
  sourceSegmentIds: [],
  provenance: 'sourced',
  verified: false,
};
const noop = () => {};

const marker = (c: HTMLElement) =>
  c.querySelector('button[aria-pressed]') as HTMLElement;
const text = (c: HTMLElement) =>
  c.querySelector('[data-claim-text]') as HTMLElement;
const del = (c: HTMLElement) =>
  c.querySelector('button[aria-label="Delete claim"]');

describe('ClaimText status marker', () => {
  it('sourced unverified → green outline marker, no check', () => {
    const { container } = render(
      <ClaimText
        claim={base}
        isSelected={false}
        onSelect={noop}
        onChange={noop}
      />,
    );
    const m = marker(container);
    expect(m.className).toContain('border-green-500');
    expect(m.className).toContain('bg-white');
    expect(m.textContent).toBe('');
  });

  it('human → blue marker', () => {
    const c = { ...base, provenance: 'human' as const };
    const { container } = render(
      <ClaimText
        claim={c}
        isSelected={false}
        onSelect={noop}
        onChange={noop}
      />,
    );
    expect(marker(container).className).toContain('border-blue-500');
  });

  it('ai_added unverified → dashed amber marker', () => {
    const c = { ...base, provenance: 'ai_added' as const, verified: false };
    const { container } = render(
      <ClaimText
        claim={c}
        isSelected={false}
        onSelect={noop}
        onChange={noop}
      />,
    );
    expect(marker(container).className).toContain('border-amber-500');
    expect(marker(container).className).toContain('border-dashed');
  });

  it('verified → filled marker with a check', () => {
    const c = { ...base, verified: true };
    const { container } = render(
      <ClaimText
        claim={c}
        isSelected={false}
        onSelect={noop}
        onChange={noop}
      />,
    );
    expect(marker(container).className).toContain('bg-green-500');
    expect(marker(container).textContent).toBe('✓');
  });

  it('clicking the marker toggles verified', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ClaimText
        claim={base}
        isSelected={false}
        onSelect={noop}
        onChange={onChange}
      />,
    );
    fireEvent.click(marker(container));
    expect(onChange).toHaveBeenCalledWith({ ...base, verified: true });
  });
});

describe('ClaimText selection + source', () => {
  it('clicking the text selects the claim (source opens in the rail)', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <ClaimText
        claim={base}
        isSelected={false}
        onSelect={onSelect}
        onChange={noop}
      />,
    );
    fireEvent.click(text(container));
    expect(onSelect).toHaveBeenCalledWith(base);
  });

  it('selected → row highlight by provenance', () => {
    const { container } = render(
      <ClaimText claim={base} isSelected onSelect={noop} onChange={noop} />,
    );
    const row = container.querySelector('[data-claim-row]') as HTMLElement;
    expect(row.className).toContain('bg-green-50');
    expect(row.className).toContain('ring-1');
  });
});

describe('ClaimText delete', () => {
  it('shows a delete control only when onDelete is provided', () => {
    const { container, rerender } = render(
      <ClaimText
        claim={base}
        isSelected={false}
        onSelect={noop}
        onChange={noop}
      />,
    );
    expect(del(container)).toBeNull();

    const onDelete = vi.fn();
    rerender(
      <ClaimText
        claim={base}
        isSelected={false}
        onSelect={noop}
        onChange={noop}
        onDelete={onDelete}
      />,
    );
    const button = del(container);
    expect(button).not.toBeNull();
    fireEvent.click(button as HTMLElement);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

describe('ClaimText split on Enter', () => {
  it('calls onSplit with the text before/after the caret (defaults to end)', () => {
    const onSplit = vi.fn();
    const { container } = render(
      <ClaimText
        claim={base}
        isSelected
        onSelect={noop}
        onChange={noop}
        onSplit={onSplit}
      />,
    );
    fireEvent.keyDown(text(container), { key: 'Enter' });
    expect(onSplit).toHaveBeenCalledTimes(1);
    expect(onSplit).toHaveBeenCalledWith('hello world', '');
  });

  it('does not call onChange when Enter is pressed without onSplit', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ClaimText claim={base} isSelected onSelect={noop} onChange={onChange} />,
    );
    fireEvent.keyDown(text(container), { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
