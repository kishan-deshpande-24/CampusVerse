import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, icon, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-white/70 mb-1.5">{label}</label>}
    <div className="relative">
      {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">{icon}</span>}
      <input
        ref={ref}
        className={`w-full bg-white/5 border ${error ? 'border-red-500/60' : 'border-white/10'} rounded-xl 
          ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 text-white placeholder-white/30
          focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all duration-200 text-sm ${className}`}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
));

Input.displayName = 'Input';
export default Input;
