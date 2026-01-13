import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/appsScriptApi';
import { Button } from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Mail, Lock, KeyRound, UserPlus } from 'lucide-react';

export default function VoterRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.registerVoter(email, password);
      if (res.success) {
        toast.success(res.message);
        navigate('/voter-login');
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light position-relative p-3">
      <div className="position-absolute bottom-0 start-0 bg-secondary opacity-10 rounded-circle filter blur-3xl" style={{width: 500, height: 500, filter: 'blur(80px)'}}></div>
      
      <button 
        onClick={() => navigate('/')} 
        className="btn btn-light position-absolute top-0 start-0 m-4 shadow-sm rounded-pill d-flex align-items-center gap-2"
        style={{ zIndex: 10 }}
      >
        <ArrowLeft size={18} /> Back
      </button>
      
      <div className="card glass border-0 shadow-lg rounded-5 w-100 animate__animated animate__zoomIn" style={{ maxWidth: 450 }}>
        <div className="card-body p-5">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="bg-primary bg-opacity-10 text-primary rounded-3 p-3">
              <UserPlus size={24} />
            </div>
            <div>
              <h3 className="fw-bold mb-0">Activate ID</h3>
              <p className="text-muted small mb-0">University Voter Registration</p>
            </div>
          </div>
          
          <form onSubmit={handleRegister} className="d-flex flex-column gap-3">
            <div>
              <label className="form-label small fw-bold text-muted text-uppercase">University Email</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 ps-3"><Mail size={18} className="text-muted"/></span>
                <input 
                  type="email" 
                  className="form-control border-start-0 ps-2"
                  placeholder="student@uni.edu"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label small fw-bold text-muted text-uppercase">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 ps-3"><Lock size={18} className="text-muted"/></span>
                <input 
                  type="password" 
                  className="form-control border-start-0 ps-2"
                  placeholder="Create Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label small fw-bold text-muted text-uppercase">Confirm Password</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 ps-3"><KeyRound size={18} className="text-muted"/></span>
                <input 
                  type="password" 
                  className="form-control border-start-0 ps-2"
                  placeholder="Repeat Password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" isLoading={loading} className="w-100 mt-3">Activate Account</Button>
          </form>

          <div className="text-center mt-4">
            <span className="small text-muted">Already active? </span>
            <span onClick={() => navigate('/voter-login')} className="small fw-bold text-primary cursor-pointer text-decoration-underline">Login here</span>
          </div>
        </div>
      </div>
    </div>
  );
}