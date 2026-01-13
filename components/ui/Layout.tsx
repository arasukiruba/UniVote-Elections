import React from 'react';
import { useAuth } from '../../App';
import { LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, actions }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg fixed-top glass shadow-sm">
        <div className="container-xl">
          <div className="d-flex align-items-center cursor-pointer" onClick={() => navigate('/')}>
             <div className="overflow-hidden d-flex align-items-center" style={{ height: 45 }}>
                <img 
                  src="https://lh3.googleusercontent.com/d/1nK9JrOKXF2ClHJIe9kF6jhp_0wAxhz5t" 
                  alt="UniVote" 
                  height="45" 
                  className="me-2 object-fit-contain" 
                  style={{ transform: 'scale(1.4)' }}
                />
             </div>
          </div>

          {user && (
            <div className="d-flex align-items-center gap-3 ms-auto">
              <div className="d-none d-md-flex flex-column text-end">
                <span className="small fw-bold text-dark">{user.name}</span>
                <span className="badge bg-light text-primary border">{user.role}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="btn btn-outline-danger btn-sm rounded-pill d-flex align-items-center gap-2"
              >
                <LogOut size={16} />
                <span className="d-none d-sm-inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow-1 pt-5 mt-5">
        <div className="container-xl py-4">
          {(title || actions) && (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-5 gap-3 animate__animated animate__fadeInDown">
              <div>
                {title && <h1 className="display-5 fw-bold text-dark mb-2 tracking-tight">{title}</h1>}
                {subtitle && <p className="lead text-muted mb-0">{subtitle}</p>}
              </div>
              {actions && <div className="d-flex gap-2">{actions}</div>}
            </div>
          )}
          
          <div key={location.pathname} className="animate__animated animate__fadeIn animate__faster">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};