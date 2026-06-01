import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  // So Matcha: Inter font, gray-300 border, primary-100 focus ring
  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-sm font-medium text-dark-700 mb-1.5 font-[Inter]">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={`w-full ${icon ? 'pl-10' : 'px-4'} py-3.5 rounded-xl border border-gray-300 bg-white text-dark-700 text-[15px] placeholder:text-gray-400 
            focus:outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-100 transition-all font-[Inter]
            ${error ? 'border-error focus:border-error focus:ring-error-light' : ''}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  )
}
