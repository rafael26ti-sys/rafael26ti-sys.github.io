'use client';

import { ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  disabled = false,
  ...props
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition ${variants[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  error,
  label,
  ...props
}: {
  error?: string;
  label?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

export function Select({
  label,
  options,
  error,
  ...props
}: {
  label?: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      >
        <option value="">Selecione uma opção</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

export function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
      {children}
    </label>
  );
}

export function Alert({
  message,
  type = 'info',
}: {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}) {
  const types = {
    success: 'bg-green-50 border-green-300 text-green-800',
    error: 'bg-red-50 border-red-300 text-red-800',
    warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
    info: 'bg-blue-50 border-blue-300 text-blue-800',
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${types[type]}`}>
      {message}
    </div>
  );
}
