import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftElement, rightElement, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[var(--color-text)] flex items-center justify-between"
          >
            <span>{label}</span>
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftElement && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[var(--color-text-muted)]">
              {leftElement}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`w-full px-4 py-2.5 text-sm bg-[var(--white)] text-[var(--text)] border rounded-[var(--radius-input)] transition-all duration-150 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-50 disabled:cursor-not-allowed ${
              error
                ? "border-[var(--color-error)] focus:ring-[var(--color-error)]"
                : "border-[var(--border)] hover:border-[var(--border-strong)]"
            } ${leftElement ? "pl-10" : ""} ${rightElement ? "pr-10" : ""} ${className}`}
            style={{ fontFamily: "var(--font-sans)" }}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 flex items-center text-[var(--color-text-muted)]">
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-[var(--color-error)] font-medium mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-[var(--text)]">
            {label}
          </label>
        )}

        <textarea
          id={textareaId}
          ref={ref}
          className={`w-full px-4 py-3 text-sm bg-[var(--white)] text-[var(--text)] border rounded-[var(--radius-input)] transition-all duration-150 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[100px] ${
            error
              ? "border-[var(--color-error)] focus:ring-[var(--color-error)]"
              : "border-[var(--border)] hover:border-[var(--border-strong)]"
          } ${className}`}
          style={{ fontFamily: "var(--font-sans)" }}
          {...props}
        />

        {error ? (
          <p className="text-xs text-[var(--color-error)] font-medium mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  helperText?: string;
  children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className = "", id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-[var(--text)]">
            {label}
          </label>
        )}

        <select
          id={selectId}
          ref={ref}
          className={`w-full px-3.5 py-2.5 text-sm bg-[var(--white)] text-[var(--text)] border rounded-[var(--radius-input)] transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] cursor-pointer disabled:bg-[var(--surface-alt)] disabled:cursor-not-allowed ${
            error
              ? "border-[var(--color-error)] focus:ring-[var(--color-error)]"
              : "border-[var(--border)] hover:border-[var(--border-strong)]"
          } ${className}`}
          style={{ fontFamily: "var(--font-sans)" }}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {error ? (
          <p className="text-xs text-[var(--color-error)] font-medium mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = "Select";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = "", id, ...props }, ref) => {
    const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <label htmlFor={checkboxId} className="inline-flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          id={checkboxId}
          ref={ref}
          className={`mt-0.5 w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-focus)] transition-colors cursor-pointer ${className}`}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-xs font-semibold text-[var(--color-text)]">{label}</span>}
            {description && <span className="text-xs text-[var(--color-text-muted)]">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, disabled = false }) => {
  return (
    <label className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
        style={{
          backgroundColor: checked ? "var(--color-primary)" : "var(--color-border-strong)",
        }}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            if (!disabled) onChange(!checked);
          }
        }}
      >
        <span
          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-4" : "translate-x-1"
          }`}
        />
      </div>
      {label && <span className="text-xs font-medium text-[var(--color-text)]">{label}</span>}
    </label>
  );
};
