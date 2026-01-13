import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/appsScriptApi';
import { useAuth } from '../../App';
import { Election, Position, Candidate, ElectionStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Check, Info, ArrowLeft, Lock, Megaphone, Trophy, BarChart2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ElectionView() {
  const { electionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [election, setElection] = useState<Election | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if(!electionId || !user) return;
    
    // Initial Load
    api.voter.getVoterElectionBundle(electionId, user.email).then(data => {
      setElection(data.election);
      setPositions(data.positions);
      setHasVoted(data.hasVoted);
      
      // If Announced, fetch full results (candidates with votes)
      if (data.election.status === ElectionStatus.ANNOUNCED) {
         api.results.getResults(electionId).then(res => {
            setCandidates(res); // Replace candidates with result-enriched candidates
         });
      } else {
        setCandidates(data.candidates);
      }
    });
  }, [electionId, user]);

  const toggleSelection = (posId: string, candId: string) => {
    // Only allow voting if it's strictly live and user hasn't voted
    if (election?.status !== ElectionStatus.LIVE || hasVoted) return;
    setSelections(prev => ({ ...prev, [posId]: candId }));
  };

  const handleSubmit = async () => {
    if(!user || !electionId) return;
    try {
      await api.voter.vote(electionId, user.email, selections);
      setConfirmOpen(false);
      setHasVoted(true);
      toast.success('Vote Cast!');
    } catch(e) { toast.error('Failed to cast vote.'); }
  };

  if (!election) return <div className="text-center pt-5">Loading...</div>;

  const isLive = election.status === ElectionStatus.LIVE;
  const isCampaign = election.status === ElectionStatus.CAMPAIGN;
  const isAnnounced = election.status === ElectionStatus.ANNOUNCED;
  const allSelected = positions.length > 0 && positions.every(p => selections[p.id]);

  return (
    <div className="min-vh-100 bg-light pb-5">
      {/* Header */}
      <div className="bg-white border-bottom sticky-top shadow-sm py-3 mb-5" style={{zIndex: 1000}}>
        <div className="container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <button onClick={() => navigate('/voter/dashboard')} className="btn btn-light rounded-circle p-2"><ArrowLeft size={20}/></button>
            <h5 className="mb-0 fw-bold">{election.title}</h5>
          </div>
          <span className={`badge ${isLive ? 'bg-danger' : isCampaign ? 'bg-info text-dark' : isAnnounced ? 'bg-success text-white' : 'bg-secondary'}`}>
            {isLive ? 'LIVE' : isCampaign ? 'CAMPAIGN' : isAnnounced ? 'RESULTS DECLARED' : election.status}
          </span>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 800 }}>
        {isAnnounced ? (
          // --- RESULTS VIEW ---
          <div className="animate__animated animate__fadeIn">
            <div className="text-center mb-5">
              <div className="d-inline-flex bg-white rounded-circle p-4 mb-3 shadow">
                <BarChart2 size={40} className="text-primary"/>
              </div>
              <h2 className="fw-bold mb-2">Official Results</h2>
              <p className="text-muted">The election has concluded and winners are declared.</p>
            </div>

            {positions.map(pos => {
              const posCandidates = candidates
                  .filter(c => c.positionId === pos.id)
                  .sort((a,b) => (b.voteCount||0) - (a.voteCount||0));
              const totalVotes = posCandidates.reduce((acc, c) => acc + (c.voteCount || 0), 0) || 1;
              const winnerId = posCandidates[0]?.id;

              return (
                <div key={pos.id} className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                  <div className="card-header bg-white p-4 border-bottom">
                    <h4 className="fw-bold mb-0 text-dark">{pos.title}</h4>
                  </div>
                  <div className="card-body p-4">
                     {posCandidates.map((c, idx) => {
                       const pct = Math.round(((c.voteCount||0)/totalVotes)*100);
                       const isWinner = c.id === winnerId;
                       
                       return (
                         <div key={c.id} className="mb-4 last-no-mb">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                               <div className="d-flex align-items-center gap-3">
                                  <div className="position-relative">
                                    <img src={c.imageUrl} className="rounded-circle border bg-light" width="56" height="56" style={{objectFit:'cover'}} alt=""/>
                                    {isWinner && (
                                      <div className="position-absolute top-0 start-0 translate-middle animate__animated animate__tada animate__infinite infinite">
                                         <span className="badge rounded-circle bg-warning p-1 border border-white shadow-sm"><Trophy size={14} className="text-white"/></span>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                     <span className={`d-block fw-bold ${isWinner ? 'text-primary' : 'text-dark'}`}>{c.fullName}</span>
                                     {isWinner && <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill small">Winner</span>}
                                  </div>
                               </div>
                               <div className="text-end">
                                  <span className="d-block fw-bold h5 mb-0">{c.voteCount} <small className="text-muted fs-6 fw-normal">votes</small></span>
                                  <span className="small text-muted fw-bold">{pct}%</span>
                               </div>
                            </div>
                            <div className="progress rounded-pill bg-light" style={{height: 12}}>
                               <div 
                                 className={`progress-bar rounded-pill ${isWinner ? 'bg-gradient-brand' : 'bg-secondary'}`} 
                                 style={{width: `${pct}%`, transition: 'width 1.5s ease-out'}}
                               ></div>
                            </div>
                         </div>
                       );
                     })}
                  </div>
                </div>
              );
            })}
          </div>

        ) : hasVoted ? (
          // --- ALREADY VOTED ---
           <div className="text-center py-5 animate__animated animate__zoomIn">
              <div className="d-inline-flex bg-success text-white rounded-circle p-4 mb-3 shadow">
                <Check size={48} />
              </div>
              <h2 className="fw-bold text-success">Vote Submitted!</h2>
              <p className="lead text-muted mb-4">Your ballot has been securely recorded.</p>
              <Button onClick={() => navigate('/voter/dashboard')}>Return Home</Button>
           </div>
        ) : (!isLive && !isCampaign) ? (
          // --- NOT STARTED / CLOSED ---
           <div className="text-center py-5">
             <Lock size={48} className="text-muted mb-3"/>
             <h3>Voting Closed</h3>
             <p className="text-muted">This election is not currently accepting votes.</p>
           </div>
        ) : (
          // --- VOTING OR CAMPAIGN ---
          <>
            {isCampaign && (
              <div className="alert alert-info border-0 shadow-sm rounded-4 d-flex align-items-center gap-3 p-4 mb-5 animate__animated animate__fadeInDown bg-gradient-brand text-white">
                <Megaphone size={32} className="flex-shrink-0" />
                <div>
                  <h4 className="fw-bold mb-1">Campaign Phase Active</h4>
                  <p className="mb-0 opacity-75">Voting has not started yet. Review the candidate profiles and manifestos below to make an informed decision.</p>
                </div>
              </div>
            )}

            {positions.map((pos) => (
              <div key={pos.id} className="mb-5 animate__animated animate__fadeIn">
                <div className="d-flex justify-content-between align-items-end mb-3 border-bottom pb-2">
                   <h2 className="fw-bold mb-0 text-dark">{pos.title}</h2>
                   {selections[pos.id] && <span className="badge bg-primary rounded-pill"><Check size={12} className="me-1"/> Selected</span>}
                </div>
                
                <div className={isLive ? "d-flex flex-column gap-3" : "row g-4"}>
                  {candidates.filter(c => c.positionId === pos.id).map(cand => {
                     const isSelected = selections[pos.id] === cand.id;
                     
                     if (isLive) {
                        // Vertical List View for Live Voting - Minimal Info
                        return (
                          <div 
                            key={cand.id}
                            onClick={() => toggleSelection(pos.id, cand.id)}
                            className={`card border-0 shadow-sm rounded-4 p-3 cursor-pointer transition d-flex flex-row align-items-center ${isSelected ? 'bg-primary bg-opacity-10 ring-2' : 'bg-white hover-shadow'}`}
                            style={{ 
                               border: isSelected ? '2px solid var(--bs-primary)' : '1px solid transparent',
                               transform: isSelected ? 'scale(1.01)' : 'scale(1)'
                            }}
                          >
                             <img src={cand.imageUrl} className="rounded-circle me-4 border shadow-sm bg-white flex-shrink-0" width="64" height="64" style={{objectFit: 'cover'}} alt=""/>
                             <div className="flex-grow-1">
                                <h5 className="fw-bold mb-0 text-dark">{cand.fullName}</h5>
                             </div>
                             <div className="ps-3 pe-2">
                                <div className={`rounded-circle border d-flex align-items-center justify-content-center ${isSelected ? 'bg-primary border-primary text-white' : 'bg-white border-secondary text-light'}`} style={{width: 32, height: 32}}>
                                   {isSelected && <Check size={20} />}
                                </div>
                             </div>
                          </div>
                        );
                     } else {
                         // Grid View for Campaign - Full Profile
                         return (
                           <div key={cand.id} className="col-12 col-md-6">
                             <div className="card h-100 border-0 shadow-sm rounded-5 overflow-hidden bg-white">
                               <div className="card-body p-4 text-center">
                                  <img src={cand.imageUrl} className="rounded-circle mb-3 border border-3 border-white shadow-sm" width="100" height="100" style={{objectFit: 'cover'}} alt=""/>
                                  <h4 className="fw-bold mb-1">{cand.fullName}</h4>
                                  <p className="text-muted fst-italic small mb-3">"{cand.slogan}"</p>
                                  <Button variant="ghost" className="btn-sm text-primary" onClick={(e) => { e.stopPropagation(); setViewCandidate(cand); }}>
                                     <Info size={16} className="me-1"/> View Full Profile
                                  </Button>
                               </div>
                               <div className="p-3 text-center small fw-bold text-uppercase bg-light text-muted">
                                  Campaign Phase
                               </div>
                             </div>
                           </div>
                         );
                     }
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {isLive && !hasVoted && (
        <div className="fixed-bottom bg-white border-top p-3 shadow-lg animate__animated animate__fadeInUp">
           <div className="container d-flex justify-content-between align-items-center" style={{ maxWidth: 800 }}>
              <div>
                <span className="fw-bold text-dark d-block">Ballot Status</span>
                <span className={`small ${allSelected ? 'text-success' : 'text-danger'}`}>
                  {allSelected ? 'Ready to Submit' : `${Object.keys(selections).length} of ${positions.length} selected`}
                </span>
              </div>
              <Button disabled={!allSelected} onClick={() => setConfirmOpen(true)} className="px-5">Submit Vote</Button>
           </div>
        </div>
      )}

      {/* Profile Modal - Only accessed in Campaign Mode */}
      <Modal isOpen={!!viewCandidate} onClose={() => setViewCandidate(null)} title="Candidate Profile">
         {viewCandidate && (
           <div className="text-center">
              <img src={viewCandidate.imageUrl} className="rounded-circle mb-3 shadow" width="120" height="120" alt=""/>
              <h3 className="fw-bold">{viewCandidate.fullName}</h3>
              <p className="text-primary fst-italic mb-4">"{viewCandidate.slogan}"</p>
              
              <div className="bg-light p-3 rounded-4 text-start mb-3">
                 <small className="text-muted fw-bold text-uppercase d-block mb-2">Manifesto</small>
                 <p className="mb-0 text-dark" style={{whiteSpace: 'pre-wrap'}}>{viewCandidate.description || "No manifesto provided."}</p>
              </div>

              {viewCandidate.files && viewCandidate.files.length > 0 && (
                 <div className="text-start">
                    <small className="text-muted fw-bold text-uppercase d-block mb-2">Campaign Materials</small>
                    <div className="d-flex flex-column gap-2">
                       {viewCandidate.files.map(f => (
                          <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="d-flex align-items-center p-2 rounded border bg-white text-decoration-none text-dark hover-shadow">
                             <span className="flex-grow-1 text-truncate small">{f.name}</span>
                             <Info size={14} className="text-muted ms-2"/>
                          </a>
                       ))}
                    </div>
                 </div>
              )}
           </div>
         )}
      </Modal>

      {/* Confirm Modal */}
      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Vote">
         <p className="text-muted mb-4">Please review your selections. This action cannot be undone.</p>
         <div className="bg-light rounded-3 p-3 mb-4">
            {positions.map(p => (
               <div key={p.id} className="d-flex justify-content-between border-bottom py-2 last-no-border">
                  <span className="text-muted small fw-bold">{p.title}</span>
                  <span className="fw-bold">{candidates.find(c => c.id === selections[p.id])?.fullName}</span>
               </div>
            ))}
         </div>
         <Button onClick={handleSubmit} className="w-100">Cast Ballot</Button>
      </Modal>
    </div>
  );
}