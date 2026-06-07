import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FlashProvider from '@/contexts/FlashProvider';
import Flash from '@/components/Flash';
import { useFlash } from '@/hooks/useFlash';

function Trigger() {
  const { addFlash } = useFlash();
  return <button onClick={() => addFlash('success', 'Saved!')}>add</button>;
}

describe('Flash', () => {
  it('shows a message after it is added, and dismisses it on click', async () => {
    const user = userEvent.setup();
    render(
      <FlashProvider>
        <Trigger />
        <Flash />
      </FlashProvider>,
    );

    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();

    await user.click(screen.getByText('add'));
    expect(screen.getByText('Saved!')).toBeInTheDocument();

    await user.click(screen.getByText('Saved!'));
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });
});
