import { Field } from '@base-ui/react/field'
import type { HTMLAttributes } from 'react'

type CheckoutFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
  type?: string
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string
  autoComplete?: string
  enterKeyHint?: HTMLAttributes<HTMLInputElement>['enterKeyHint']
  required?: boolean
}

export function CheckoutField({
  label,
  value,
  onChange,
  className,
  type = 'text',
  inputMode,
  placeholder,
  autoComplete,
  enterKeyHint,
  required = true,
}: CheckoutFieldProps) {
  return (
    <Field.Root className={className}>
      <Field.Label className="text-sm font-medium text-[var(--color-ink)]">{label}</Field.Label>
      <Field.Control
        required={required}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        enterKeyHint={enterKeyHint}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-2 h-11 w-full border border-[var(--color-line)] bg-[var(--color-paper)] px-4 text-sm text-[var(--color-ink)] outline-none transition duration-150 ease-out placeholder:text-[var(--color-muted)]/70 focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-soft)]"
      />
    </Field.Root>
  )
}
