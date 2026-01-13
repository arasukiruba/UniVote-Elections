import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = '500px' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed-top w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1050 }}>
      {/* Backdrop */}
      <div 
        className="position-absolute w-100 h-100 bg-dark opacity-50 animate__animated animate__fadeIn"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div 
        className="bg-white rounded-4 shadow-lg position-relative d-flex flex-column animate__animated animate__zoomIn animate__faster border"
        style={{ width: '100%', maxWidth: maxWidth, maxHeight: '90vh', margin: '1rem', zIndex: 1051 }}
      >
        <div className="d-flex justify-content-between align-items-center p-4 border-bottom bg-light bg-opacity-50 rounded-top-4">
          <h5 className="mb-0 fw-bold text-dark">{title}</h5>
          <button onClick={onClose} className="btn btn-white btn-sm border rounded-circle p-2 shadow-sm">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};