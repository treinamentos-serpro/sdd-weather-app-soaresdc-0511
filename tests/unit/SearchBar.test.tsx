import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

describe('SearchBar', () => {
  it.each(['', '   '])('não dispara onSearch para entrada vazia %j', async (value) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    if (value) await user.type(screen.getByLabelText('Cidade'), value);
    const button = screen.getByRole('button', { name: 'Buscar' });
    expect(button).toBeDisabled();
    await user.click(button);
    fireEvent.submit(screen.getByRole('search', { name: 'Buscar cidade' }));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it.each([
    ['Lisboa', 'Lisboa', 'button'],
    ['  São Paulo  ', 'São Paulo', 'enter'],
  ] as const)('envia o termo %j como %j por %s', async (value, expected, method) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), value);
    expect(onSearch).not.toHaveBeenCalled();

    if (method === 'enter') {
      await user.keyboard('{Enter}');
    } else {
      await user.click(screen.getByRole('button', { name: 'Buscar' }));
    }

    expect(onSearch).toHaveBeenCalledExactlyOnceWith(expected);
  });
});
