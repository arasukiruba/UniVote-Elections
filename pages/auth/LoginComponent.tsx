import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { api } from '../../services/appsScriptApi';
import { Button } from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { Role } from '../../types';

interface LoginProps {
  title: string;
  role: Role;
  redirectPath: string;
  allowRegister?: boolean;
}

export const LoginComponent: React.FC<LoginProps> = ({ title, role, redirectPath, allowRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await api.auth.login(email, password);
      if (user) {
        if (role !== Role.MASTER && user.role !== role) {
           toast.error('Invalid role access');
           setLoading(false);
           return;
        }
        login(user);
        toast.success(`Welcome back, ${user.name}`);
        navigate(redirectPath);
      } else {
        toast.error('Invalid credentials or account disabled');
      }
    } catch (err) {
      toast.error('Login failed or network error');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light position-relative p-3">
      {/* Background decoration */}
      <div className="position-absolute top-0 end-0 bg-primary opacity-10 rounded-circle filter blur-3xl" style={{width: 600, height: 600, filter: 'blur(80px)'}}></div>
      
      <button 
        onClick={() => navigate('/')} 
        className="btn btn-light position-absolute top-0 start-0 m-4 shadow-sm rounded-pill d-flex align-items-center gap-2"
        style={{ zIndex: 10 }}
      >
        <ArrowLeft size={18} /> Back
      </button>
      
      <div className="card glass border-0 shadow-lg rounded-5 w-100 animate__animated animate__fadeInUp" style={{ maxWidth: 450 }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <div className="overflow-hidden d-inline-flex align-items-center justify-content-center mb-3">
                <img 
                  src="https://lh3.googleusercontent.com/d/1nK9JrOKXF2ClHJIe9kF6jhp_0wAxhz5t" 
                  alt="UniVote" 
                  height="80" 
                  className="object-fit-contain" 
                  style={{ transform: 'scale(1.5)' }} 
                />
            </div>
            <h2 className="fw-bold text-dark">{title}</h2>
            <p className="text-muted small">Enter your credentials to continue</p>
          </div>
          
          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-light border-end-0 text-muted ps-3"><Mail size={20}/></span>
              <input 
                type="text" 
                className="form-control bg-light border-start-0 ps-2" 
                placeholder="ID / Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="input-group input-group-lg mb-2">
              <span className="input-group-text bg-light border-end-0 text-muted ps-3"><Lock size={20}/></span>
              <input 
                type="password" 
                className="form-control bg-light border-start-0 ps-2" 
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" isLoading={loading} className="w-100 py-3 fs-5">Sign In</Button>
          </form>
          
          {allowRegister && (
            <div className="mt-4 pt-3 border-top text-center">
              <p className="text-muted small mb-2">Don't have an account?</p>
              <Button variant="ghost" onClick={() => navigate('/voter/register')} className="p-0 text-primary fw-bold">
                Register New Voter
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};