import type { ReactNode } from "react";
import { CheckboxInput, NumberInput, SelectInput } from "../components/shared/formControls";

export function Section({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden border border-[var(--border)] bg-white/[0.015]">
      <div>{children}</div>
    </section>
  );
}

function SettingRow({
  children,
  description,
  isFirst = false,
  label,
}: {
  children: ReactNode;
  description: string;
  isFirst?: boolean;
  label: string;
}) {
  return (
    <div className={`${isFirst ? "" : "border-t border-t-[var(--border)] "}border-l-2 border-l-transparent px-4 py-3 transition hover:bg-white/[0.015] focus-within:border-l-[var(--violet)] focus-within:bg-[var(--violet-soft)]`}>
      <div className="min-w-0">
        <p className="text-[13px] text-[var(--text)]">{label}</p>
        <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">{description}</p>
      </div>
      <div className="mt-3 flex min-w-0 items-center">{children}</div>
    </div>
  );
}

export function CheckboxSetting({
  checked,
  description,
  isFirst,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  isFirst?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <SettingRow description={description} isFirst={isFirst} label={label}>
      <label className="inline-flex items-center gap-2 text-[12px] text-[var(--text)]">
        <CheckboxInput checked={checked} onChange={onChange} />
        <span>{checked ? "Enabled" : "Disabled"}</span>
      </label>
    </SettingRow>
  );
}

export function SelectSetting<T extends string>({
  description,
  isFirst,
  label,
  onChange,
  options,
  value,
}: {
  description: string;
  isFirst?: boolean;
  label: string;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  value: T;
}) {
  return (
    <SettingRow description={description} isFirst={isFirst} label={label}>
      <SelectInput
        className="max-w-[180px]"
        onChange={(event) => onChange(event.target.value as T)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectInput>
    </SettingRow>
  );
}

export function NumberSetting({
  description,
  isFirst,
  label,
  max,
  min,
  onChange,
  value,
}: {
  description: string;
  isFirst?: boolean;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <SettingRow description={description} isFirst={isFirst} label={label}>
      <NumberInput
        className="max-w-[92px]"
        max={max}
        min={min}
        onValueChange={onChange}
        value={value}
      />
    </SettingRow>
  );
}

export function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-t border-l-2 border-t-[var(--border)] border-l-transparent px-4 py-3">
      <p className="text-[13px] text-[var(--text)]">{label}</p>
      <p className="mt-2 truncate text-[12px] text-[var(--muted)]">{value}</p>
    </div>
  );
}
