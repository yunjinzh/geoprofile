import React from 'react';

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
}

export const NeuButton: React.FC<NeuButtonProps> = ({ children, active, className = '', icon, ...props }) => {
  return (
    <button
      className={`
        flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all duration-300
        ${active 
          ? 'bg-neu-base shadow-neu-btn-active text-neu-text' 
          : 'bg-neu-base shadow-neu-btn hover:-translate-y-1 hover:shadow-lg text-neu-text'
        }
        ${className}
      `}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

export const NeuCard: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-neu-base shadow-neu-out rounded-2xl p-6 ${className}`}>
      {title && <h3 className="text-xl font-bold mb-4 text-neu-text tracking-wide">{title}</h3>}
      {children}
    </div>
  );
};

export const NeuInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  return (
    <input
      {...props}
      className="bg-neu-base shadow-neu-in rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-neu-shadow/20 w-full text-neu-text placeholder-gray-400"
    />
  );
};