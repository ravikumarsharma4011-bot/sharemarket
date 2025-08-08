import React from 'react'
export const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className='', children }) => (
  <div className={`rounded-2xl shadow-sm border border-gray-200 ${className}`}>{children}</div>
);
export const CardContent: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className='', children }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);
export const Button: React.FC<React.PropsWithChildren<{ onClick?: () => void, className?: string, type?: 'button'|'submit' }>> = ({ onClick, className='', children, type='button' }) => (
  <button type={type} onClick={onClick} className={`px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 active:scale-[0.99] ${className}`}>{children}</button>
);
export const Select: React.FC<{ value: string, onChange: (v: string)=>void, children: React.ReactNode, className?: string }> = ({ value, onChange, children, className='' }) => (
  <select value={value} onChange={(e)=>onChange(e.target.value)} className={`px-2 py-2 rounded-xl border border-gray-300 ${className}`}>{children}</select>
);
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`px-3 py-2 rounded-xl border border-gray-300 ${props.className||''}`} />
);
export const Label: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <label className="text-sm text-gray-600">{children}</label>
);
