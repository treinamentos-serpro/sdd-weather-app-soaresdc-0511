import type { Unit } from "../types/weather";

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1 shadow-glass backdrop-blur-md"
    >
      <button
        type="button"
        aria-label="Celsius"
        aria-pressed={unit === "celsius"}
        onClick={() => onChange("celsius")}
        className={`min-w-12 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
          unit === "celsius"
            ? "bg-accent-500 text-white"
            : "text-white/75 hover:bg-white/10 hover:text-white"
        }`}
      >
        °C
      </button>
      <button
        type="button"
        aria-label="Fahrenheit"
        aria-pressed={unit === "fahrenheit"}
        onClick={() => onChange("fahrenheit")}
        className={`min-w-12 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
          unit === "fahrenheit"
            ? "bg-accent-500 text-white"
            : "text-white/75 hover:bg-white/10 hover:text-white"
        }`}
      >
        °F
      </button>
    </div>
  );
}