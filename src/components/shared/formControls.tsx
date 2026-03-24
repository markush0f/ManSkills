import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

const controlBaseClass =
  "w-full border border-[var(--border)] bg-transparent text-[12px] text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[rgba(255,255,255,0.16)]";

function joinClasses(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={joinClasses(
        controlBaseClass,
        "h-8 px-2.5",
        className,
      )}
      {...props}
    />
  );
}

export function NumberInput({
  className,
  max,
  min,
  onValueChange,
  step = 1,
  value,
}: {
  className?: string;
  max?: number;
  min?: number;
  onValueChange?: (value: number) => void;
  step?: number;
  value: number;
}) {
  return (
    <input
      className={joinClasses(
        controlBaseClass,
        "ui-number-input h-8 px-2.5",
        className,
      )}
      max={max}
      min={min}
      onChange={(event) => {
        const nextValue = Number(event.target.value);

        if (!Number.isNaN(nextValue)) {
          onValueChange?.(nextValue);
        }
      }}
      step={step}
      type="number"
      value={value}
    />
  );
}

export function SelectInput({
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={joinClasses("relative w-full", className)}>
      <select
        className={joinClasses(
          controlBaseClass,
          "h-8 appearance-none px-2.5 pr-8",
        )}
        {...props}
      >
        {children}
      </select>

      <span className="pointer-events-none absolute inset-y-0 right-0 flex w-8 items-center justify-center border-l border-[var(--border)] text-[var(--muted)]">
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.25 6.5 8 10.25 11.75 6.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
        </svg>
      </span>
    </div>
  );
}

export function CheckboxInput({
  className,
  checked,
  onChange,
}: {
  checked: boolean;
  className?: string;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      className={joinClasses(
        `grid h-4 w-4 place-items-center border transition ${
          checked
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[var(--border)] bg-transparent text-transparent"
        }`,
        className,
      )}
      onClick={() => onChange?.(!checked)}
      role="checkbox"
      type="button"
    >
      <svg
        aria-hidden="true"
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="m3.5 8 2.6 2.6L12.5 4.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    </button>
  );
}
