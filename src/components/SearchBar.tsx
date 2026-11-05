import { useId, useState, type FormEvent } from "react";

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const inputId = useId();
  const [city, setCity] = useState("");
  const normalizedCity = city.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled || !normalizedCity) return;

    onSearch(normalizedCity);
  }

  return (
    <form
      role="search"
      aria-label="Buscar cidade"
      onSubmit={handleSubmit}
      className="w-full rounded-xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md sm:p-5"
    >
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-medium text-white"
      >
        Cidade
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          type="search"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Ex.: Lisboa"
          disabled={disabled}
          required
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-night-900/70 px-4 py-3 text-white placeholder:text-white/70 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400/60 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || !normalizedCity}
          className="rounded-lg bg-accent-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-night-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}