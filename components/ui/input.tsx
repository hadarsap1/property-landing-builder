'use client'

import type { InputHTMLAttributes } from 'react'

/**
 * Standard form input. Pass `label` to get an associated <label> —
 * requires `id` so the pair is linked for screen readers.
 */
export function Input({
  label,
  hint,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
}) {
  const input = (
    <input
      className={`w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  )

  if (!label) return input

  return (
    <div>
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {input}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}
