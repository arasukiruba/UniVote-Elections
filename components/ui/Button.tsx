import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  let btnClass = 'btn ';
  
  switch(variant) {
    case 'primary': 
      btnClass += 'btn-primary bg-gradient-brand border-0 shadow-sm text-white'; 
      break;
    case 'secondary': 
      btnClass += 'btn-white bg-white border shadow-sm text-dark hover-shadow'; 
      break;
    case 'danger': 
      btnClass += 'btn-danger bg-opacity-10 text-danger border-0'; 
      break;
    case 'ghost': 
      btnClass += 'btn-link text-decoration-none text-muted'; 
      break;
    case 'outline': 
      btnClass += 'btn-outline-primary'; 
      break;
    default: 
      btnClass += 'btn-primary';
  }

  return (
    <button 
      className={`${btnClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="d-flex align-items-center justify-content-center">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <span>Processing...</span>
        </div>
      ) : children}
    </button>
  );
};