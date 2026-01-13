import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCog, Users, MessageCircle, X, Phone, Mail, Instagram, ArrowRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const cards = [
    { title: 'Master Login', role: 'Super Admin', icon: ShieldCheck, path: '/master-login', color: 'bg-primary text-white', iconBg: 'bg-white bg-opacity-25' },
    { title: 'Administrator', role: 'Election Manager', icon: UserCog, path: '/admin-login', color: 'bg-white text-dark', iconBg: 'bg-light text-primary' },
    { title: 'Voter Login', role: 'Student Access', icon: Users, path: '/voter-login', color: 'bg-white text-dark', iconBg: 'bg-light text-primary' },
  ];

  return (
    <div className="min-vh-100 bg-light d-flex flex-column align-items-center justify-content-center position-relative overflow-hidden p-3">
      
      {/* Background Blobs (Simulated with absolute divs) */}
      <div className="position-absolute top-0 start-0 translate-middle rounded-circle bg-primary opacity-25 filter blur-3xl" style={{ width: '40vw', height: '40vw', filter: 'blur(80px)', zIndex: 0 }}></div>
      <div className="position-absolute bottom-0 end-0 translate-middle rounded-circle bg-danger opacity-10 filter blur-3xl" style={{ width: '40vw', height: '40vw', filter: 'blur(80px)', zIndex: 0 }}></div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="position-absolute top-0 end-0 m-4 btn btn-light rounded-circle shadow-lg d-flex align-items-center justify-content-center animate__animated animate__bounceIn"
        style={{ width: 56, height: 56, zIndex: 100 }}
      >
        <MessageCircle size={24} className="text-primary" />
      </button>

      {/* Sidebar / Offcanvas Custom */}
      {isSidebarOpen && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50" style={{ zIndex: 1040 }} onClick={() => setIsSidebarOpen(false)}></div>
          <div className="position-fixed top-0 end-0 h-100 bg-white shadow-lg p-4 animate__animated animate__slideInRight" style={{ width: 350, zIndex: 1050 }}>
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
              <h4 className="fw-bold mb-0">Contact Us</h4>
              <button onClick={() => setIsSidebarOpen(false)} className="btn btn-light rounded-circle p-2"><X size={20}/></button>
            </div>
            <div className="d-flex flex-column gap-3">
              <a href="https://wa.me/917708414584" target="_blank" className="text-decoration-none text-dark d-flex align-items-center p-3 rounded-3 bg-light hover-shadow transition">
                <div className="bg-success bg-opacity-10 text-success p-2 rounded-3 me-3"><Phone size={20}/></div>
                <div><small className="text-muted d-block uppercase fw-bold" style={{fontSize: '0.7rem'}}>Whatsapp</small><span className="fw-semibold">7708414584</span></div>
              </a>
              <a href="mailto:arasukirubanandhan@gmail.com" className="text-decoration-none text-dark d-flex align-items-center p-3 rounded-3 bg-light hover-shadow transition">
                <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3 me-3"><Mail size={20}/></div>
                <div><small className="text-muted d-block uppercase fw-bold" style={{fontSize: '0.7rem'}}>Email</small><span className="fw-semibold text-truncate d-block" style={{maxWidth: 180}}>arasukirubanandhan@gmail.com</span></div>
              </a>
            </div>
          </div>
        </>
      )}

      <div className="position-relative z-1 text-center container" style={{ maxWidth: 1000 }}>
        <div className="mb-5 animate__animated animate__fadeInDown">
          <div className="d-inline-flex justify-content-center align-items-center overflow-hidden mb-3">
             <img 
               src="https://lh3.googleusercontent.com/d/1nK9JrOKXF2ClHJIe9kF6jhp_0wAxhz5t" 
               alt="UniVote Logo" 
               className="img-fluid" 
               style={{ maxHeight: 200, transform: 'scale(1.5)' }} 
             />
          </div>
          <p className="lead text-muted mx-auto" style={{ maxWidth: 600 }}>
            The next generation secure election platform. Empowering universities with transparency, speed, and integrity.
          </p>
        </div>

        <div className="row g-4 justify-content-center">
          {cards.map((card, idx) => (
            <div key={idx} className="col-12 col-md-4 animate__animated animate__fadeInUp" style={{ animationDelay: `${idx * 100}ms` }}>
              <div 
                onClick={() => navigate(card.path)}
                className={`card h-100 border-0 shadow-medium card-hover cursor-pointer rounded-4 text-start overflow-hidden ${card.color === 'bg-primary text-white' ? 'bg-gradient-brand text-white' : 'glass'}`}
              >
                <div className="card-body p-4 d-flex flex-column">
                  <div className={`rounded-3 d-flex align-items-center justify-content-center mb-4 ${card.iconBg}`} style={{ width: 56, height: 56 }}>
                    <card.icon size={28} />
                  </div>
                  <h3 className="h4 fw-bold mb-1">{card.title}</h3>
                  <p className={`mb-4 small fw-semibold ${card.color.includes('text-white') ? 'text-white-50' : 'text-muted'}`}>{card.role}</p>
                  
                  <div className={`mt-auto d-flex align-items-center fw-bold small ${card.color.includes('text-white') ? 'text-white' : 'text-primary'}`}>
                    Access Portal <ArrowRight size={16} className="ms-2" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-5 text-muted small animate__animated animate__fadeIn" style={{ animationDelay: '1s' }}>
          &copy; Designed by arasukirubanandhan - All rights reserved.
        </footer>
      </div>
    </div>
  );
}