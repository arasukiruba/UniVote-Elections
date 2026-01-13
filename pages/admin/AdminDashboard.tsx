import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/ui/Layout';
import { api } from '../../services/appsScriptApi';
import { Election, ElectionStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Calendar, ChevronRight, PlusCircle, Trash2, BarChart2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../App';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const navigate = useNavigate();

  const fetchElections = async () => {
    // Robust check for user ID (handles potentially different casing from backend)
    const userId = user?.id || (user as any)?._id;
    
    if (userId) {
      setIsFetching(true);
      try {
        const data = await api.admin.getElections(userId);
        // Ensure data is an array before setting state
        setElections(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Fetch Error:", e);
        toast.error("Failed to load elections");
      } finally {
        setIsFetching(false);
      }
    }
  };

  useEffect(() => {
    fetchElections();
  }, [user]);

  const handleCreate = async () => {
    const userId = user?.id || (user as any)?._id;
    if (!newTitle || !userId) return;
    
    setIsCreating(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      await api.admin.createElection(newTitle, today, userId);
      setNewTitle('');
      toast.success('Election created');
      // Force a refresh from server
      await fetchElections();
    } catch(e) {
      console.error(e);
      toast.error("Creation failed");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this election?")) {
      try {
        await api.admin.deleteElection(id);
        toast.success('Deleted');
        fetchElections();
      } catch (err) { toast.error("Deletion failed"); }
    }
  };

  const getStatusBadge = (s: ElectionStatus) => {
    switch(s) {
      case ElectionStatus.LIVE: return 'bg-danger text-white';
      case ElectionStatus.COMPLETED: return 'bg-secondary text-white';
      case ElectionStatus.ANNOUNCED: return 'bg-success text-white';
      case ElectionStatus.CAMPAIGN: return 'bg-info text-white';
      default: return 'bg-warning text-dark';
    }
  };

  return (
    <Layout 
      title="Election Management" 
      subtitle="Launch and manage secure university elections."
      actions={
        <Button variant="secondary" onClick={fetchElections} disabled={isFetching} className="d-flex align-items-center gap-2">
          <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </Button>
      }
    >
      
      {/* Create Section */}
      <div className="card border-0 shadow-medium rounded-4 p-4 mb-5 bg-white bg-opacity-75 animate__animated animate__fadeInDown">
        <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <PlusCircle className="text-primary" size={20} /> Launch New Election
        </h5>
        <div className="d-flex flex-column flex-md-row gap-3">
          <div className="flex-grow-1">
            <input 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="form-control form-control-lg bg-light border-0"
              placeholder="e.g. Student Council Election 2024"
            />
          </div>
          <Button onClick={handleCreate} disabled={!newTitle || isCreating} className="px-4">
             {isCreating ? 'Initializing...' : 'Create Election'}
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="row g-4">
        {isFetching && elections.length === 0 ? (
          <div className="col-12 text-center py-5">
             <div className="spinner-border text-primary" role="status"></div>
             <p className="text-muted mt-2">Loading elections...</p>
          </div>
        ) : (
          <>
            {elections.map((election, idx) => (
              <div key={election.id} className="col-12 col-md-6 col-lg-4 animate__animated animate__fadeInUp" style={{animationDelay: `${idx * 100}ms`}}>
                <div className="card h-100 border-0 shadow-sm card-hover rounded-4">
                   <div className="card-body p-4 d-flex flex-column">
                     <div className="d-flex justify-content-between align-items-start mb-3">
                       <span className={`badge rounded-pill ${getStatusBadge(election.status)}`}>
                         {election.status === ElectionStatus.LIVE && <span className="spinner-grow spinner-grow-sm me-1" style={{width: '0.5rem', height: '0.5rem'}}></span>}
                         {election.status.replace('_', ' ')}
                       </span>
                       <button onClick={(e) => handleDelete(election.id, e)} className="btn btn-link p-0 text-muted hover-text-danger">
                          <Trash2 size={18} />
                       </button>
                     </div>
                     
                     <h4 className="fw-bold mb-2 text-dark">{election.title}</h4>
                     <div className="d-flex align-items-center text-muted small mb-4">
                       <Calendar size={14} className="me-2" />
                       {new Date(election.pollingDate).toLocaleDateString()}
                     </div>
                     
                     <div className="mt-auto">
                        <Button 
                            variant="secondary" 
                            className="w-100 d-flex justify-content-between align-items-center bg-light border-0"
                            onClick={() => navigate(`/admin/election/${election.id}`)}
                          >
                            Control Panel 
                            <ChevronRight size={16} />
                        </Button>
                     </div>
                   </div>
                </div>
              </div>
            ))}
            
            {!isFetching && elections.length === 0 && (
              <div className="col-12 text-center py-5">
                <div className="d-inline-flex bg-light rounded-circle p-4 mb-3 text-muted">
                  <BarChart2 size={40} />
                </div>
                <h5 className="text-muted">No elections found. Create one above.</h5>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}