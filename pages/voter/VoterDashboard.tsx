import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/ui/Layout';
import { api } from '../../services/appsScriptApi';
import { useAuth } from '../../App';
import { Election, ElectionStatus } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Vote, Calendar, Lock } from 'lucide-react';

export default function VoterDashboard() {
  const { user } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) api.voter.getAuthorizedElections(user.email).then(setElections).catch(console.error);
  }, [user]);

  return (
    <Layout title="Your Elections" subtitle="Cast your vote in the active elections below.">
      <div className="row g-4">
        {elections.map((e, idx) => {
            const isLive = e.status === ElectionStatus.LIVE;
            return (
              <div key={e.id} className="col-12 col-md-6 col-lg-4 animate__animated animate__fadeInUp" style={{animationDelay: `${idx * 100}ms`}}>
                <div 
                  onClick={() => navigate(`/voter/election/${e.id}`)}
                  className={`card h-100 border-0 shadow-sm card-hover rounded-5 cursor-pointer overflow-hidden ${isLive ? 'border-primary' : ''}`}
                  style={{ borderTop: isLive ? '4px solid var(--bs-primary)' : 'none' }}
                >
                   <div className="card-body p-4 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-4">
                          <div className={`rounded-3 d-flex align-items-center justify-content-center ${isLive ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{width: 48, height: 48}}>
                              <Vote size={24} />
                          </div>
                          <span className={`badge rounded-pill ${isLive ? 'bg-danger text-white' : 'bg-light text-dark border'}`}>
                              {isLive && <span className="spinner-grow spinner-grow-sm me-1" style={{width: '0.4rem', height: '0.4rem'}}></span>}
                              {e.status.replace('_', ' ')}
                          </span>
                      </div>
                      
                      <h4 className="fw-bold mb-2 text-dark">{e.title}</h4>
                      <div className="text-muted small mb-4 d-flex align-items-center">
                          <Calendar size={14} className="me-2"/>
                          {new Date(e.pollingDate).toLocaleDateString()}
                      </div>
                      
                      <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center fw-bold small text-primary">
                         <span>{isLive ? 'Enter Booth' : 'View Details'}</span>
                         <ChevronRight size={16} />
                      </div>
                   </div>
                </div>
              </div>
            );
        })}
        {elections.length === 0 && (
          <div className="col-12 text-center py-5">
             <div className="d-inline-flex bg-white rounded-circle p-4 shadow-sm mb-3 text-muted">
                <Lock size={32} />
             </div>
             <h5 className="text-muted">No active elections found</h5>
          </div>
        )}
      </div>
    </Layout>
  );
}