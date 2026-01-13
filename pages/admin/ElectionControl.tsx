import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/ui/Layout';
import { api } from '../../services/appsScriptApi';
import { Election, Position, Candidate, WhitelistEntry, ElectionStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ArrowLeft, Trash2, Edit2, Users, FileText, BarChart3, Check, X, Upload, AlertTriangle, FileDown, List, Paperclip, Plus, Calendar, Settings, Mail, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Setup Tab ---
const SetupTab = ({ electionId }: { electionId: string }) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [newPos, setNewPos] = useState('');
  
  const [candName, setCandName] = useState('');
  const [candSlogan, setCandSlogan] = useState('');
  const [candDesc, setCandDesc] = useState('');
  const [candPosId, setCandPosId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // File upload states
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [candFiles, setCandFiles] = useState<File[]>([]);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editDocInputRef = useRef<HTMLInputElement>(null);
  
  const refresh = async () => {
    try {
      const [p, c] = await Promise.all([
         api.admin.getPositions(electionId),
         api.admin.getCandidates(electionId)
      ]);
      setPositions(p);
      setCandidates(c);
    } catch (e) { toast.error("Failed to load data"); }
  };
  useEffect(() => { refresh(); }, []);

  const addPos = async () => {
    if(!newPos) return;
    setIsProcessing(true);
    await api.admin.addPosition(electionId, newPos);
    setNewPos('');
    refresh();
    setIsProcessing(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error("Image size must be less than 2MB");
      if (isEdit && editingCandidate) {
        toast.promise(
          api.admin.uploadFile(file, 'profile').then(url => {
            setEditingCandidate({ ...editingCandidate, imageUrl: url });
          }),
          { loading: 'Uploading...', success: 'Image updated', error: 'Upload failed' }
        );
      } else {
        setProfileImageFile(file);
        setProfileImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const files = e.target.files;
    if (files) {
      const validFiles: File[] = [];
      Array.from(files).forEach((f: File) => {
         if (f.size > 5 * 1024 * 1024) toast.error(`Skipped ${f.name} (>5MB)`);
         else validFiles.push(f);
      });
      if (isEdit && editingCandidate) {
        toast.promise(
          api.admin.uploadBatch(validFiles, 'campaign').then(uploaded => {
             setEditingCandidate(prev => prev ? ({ ...prev, files: [...(prev.files || []), ...uploaded] as any }) : null);
          }),
          { loading: 'Uploading...', success: 'Files attached', error: 'Upload failed' }
        );
      } else {
        setCandFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  const removeFile = (indexOrId: number | string, isEdit: boolean = false) => {
     if (isEdit && editingCandidate) {
        setEditingCandidate(prev => prev ? ({ ...prev, files: (prev.files || []).filter(f => f.id !== indexOrId) }) : null);
     } else {
        setCandFiles(prev => prev.filter((_, i) => i !== indexOrId));
     }
  };

  const addCand = async () => {
    if(!candPosId || !candName) return;
    setIsProcessing(true);
    const toastId = toast.loading('Processing...');
    try {
      const imagePromise = profileImageFile ? api.admin.uploadFile(profileImageFile, 'profile') : Promise.resolve('https://picsum.photos/200');
      const filesPromise = candFiles.length > 0 ? api.admin.uploadBatch(candFiles, 'campaign') : Promise.resolve([]);
      const [imageUrl, uploadedFiles] = await Promise.all([imagePromise, filesPromise]);

      await api.admin.addCandidate({
        electionId,
        positionId: candPosId,
        fullName: candName,
        slogan: candSlogan,
        description: candDesc,
        imageUrl,
        files: uploadedFiles as any
      });

      setCandName(''); setCandSlogan(''); setCandDesc(''); 
      setProfileImageFile(null); setProfileImagePreview('');
      setCandFiles([]); setCandPosId('');
      toast.success('Candidate registered', { id: toastId });
      refresh();
    } catch (e) {
      toast.error('Failed to register', { id: toastId });
    }
    setIsProcessing(false);
  };

  const updateCand = async () => {
    if(!editingCandidate) return;
    setIsProcessing(true);
    try {
      await api.admin.updateCandidate(editingCandidate);
      setEditingCandidate(null);
      toast.success('Candidate updated');
      refresh();
    } catch (e) { toast.error('Update failed'); }
    setIsProcessing(false);
  };

  const deleteCand = async (id: string) => {
    if(confirm("Delete candidate?")) {
      await api.admin.deleteCandidate(id);
      refresh();
    }
  };

  return (
    <div className="row g-4">
      {/* Forms Column */}
      <div className="col-12 col-lg-4">
        {/* Position Management */}
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><Settings size={18} className="text-primary"/> Manage Positions</h6>
            <div className="d-flex gap-2">
              <input className="form-control" placeholder="e.g. President" value={newPos} onChange={e => setNewPos(e.target.value)} />
              <Button onClick={addPos} disabled={!newPos || isProcessing}><Plus size={20}/></Button>
            </div>
          </div>
        </div>

        {/* Add Candidate Form */}
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><Users size={18} className="text-primary"/> Register Candidate</h6>
            <div className="d-flex flex-column gap-3">
              <select className="form-select" value={candPosId} onChange={e => setCandPosId(e.target.value)}>
                <option value="">Select Position...</option>
                {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <input className="form-control" placeholder="Full Name" value={candName} onChange={e => setCandName(e.target.value)} />
              <input className="form-control" placeholder="Campaign Slogan" value={candSlogan} onChange={e => setCandSlogan(e.target.value)} />
              
              {/* Image Upload */}
              <div className="d-flex gap-2 align-items-center">
                 <div onClick={() => fileInputRef.current?.click()} className="flex-grow-1 border border-2 border-dashed border-light rounded-3 p-3 text-center cursor-pointer hover-shadow text-muted small bg-light">
                   <Upload size={18} className="mb-1 d-block mx-auto"/> 
                   {profileImageFile ? profileImageFile.name : 'Upload Photo'}
                 </div>
                 <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={(e) => handleImageSelect(e, false)} />
                 {profileImagePreview && <img src={profileImagePreview} className="rounded-3 border flex-shrink-0" width="60" height="60" style={{objectFit:'cover'}} />}
              </div>

              <textarea className="form-control" placeholder="Manifesto..." rows={3} value={candDesc} onChange={e => setCandDesc(e.target.value)} />
              
              {/* File Attachments */}
              <div>
                 <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="small fw-bold text-muted">CAMPAIGN FILES</label>
                    <button className="btn btn-sm btn-link p-0 text-decoration-none" onClick={() => docInputRef.current?.click()}><Paperclip size={14} /> Add</button>
                    <input type="file" ref={docInputRef} className="d-none" multiple onChange={(e) => handleFileSelect(e, false)} />
                 </div>
                 {candFiles.map((f, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center bg-light p-2 rounded-2 mb-1 border">
                       <span className="small text-truncate" style={{maxWidth: 150}}>{f.name}</span>
                       <X size={14} className="cursor-pointer text-danger" onClick={() => removeFile(i, false)}/>
                    </div>
                 ))}
              </div>

              <Button onClick={addCand} disabled={!candPosId || isProcessing} isLoading={isProcessing} className="w-100">Add Candidate</Button>
            </div>
          </div>
        </div>
      </div>

      {/* List Column */}
      <div className="col-12 col-lg-8">
        {positions.map((pos) => {
          const posCandidates = candidates.filter(c => c.positionId === pos.id);
          return (
            <div key={pos.id} className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-white p-3 d-flex justify-content-between align-items-center">
                 <h5 className="mb-0 fw-bold">{pos.title}</h5>
                 <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={() => {if(confirm('Delete position?')) { api.admin.deletePosition(pos.id); refresh(); }}}>Delete Position</button>
              </div>
              <div className="card-body">
                 <div className="row g-3">
                   {posCandidates.map(c => (
                     <div key={c.id} className="col-12 col-md-6">
                       <div className="d-flex align-items-center p-3 border rounded-4 bg-light position-relative card-hover">
                          <img src={c.imageUrl} className="rounded-3 me-3 bg-white shadow-sm flex-shrink-0" width="56" height="56" style={{objectFit:'cover'}} alt=""/>
                          <div className="flex-grow-1 text-truncate">
                            <div className="fw-bold text-dark">{c.fullName}</div>
                            <small className="text-muted d-block text-truncate">{c.slogan}</small>
                          </div>
                          <div className="d-flex gap-1">
                             <button onClick={() => setEditingCandidate(c)} className="btn btn-sm btn-white border shadow-sm p-1"><Edit2 size={14} className="text-muted"/></button>
                             <button onClick={() => deleteCand(c.id)} className="btn btn-sm btn-white border shadow-sm p-1"><Trash2 size={14} className="text-danger"/></button>
                          </div>
                       </div>
                     </div>
                   ))}
                   {posCandidates.length === 0 && <p className="text-muted small text-center my-4 fst-italic">No candidates added yet.</p>}
                 </div>
              </div>
            </div>
          );
        })}
        {positions.length === 0 && <div className="text-center py-5 text-muted border border-dashed rounded-4">Add a position from the left panel to get started.</div>}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editingCandidate} onClose={() => setEditingCandidate(null)} title="Update Candidate">
        {editingCandidate && (
          <div className="d-flex flex-column gap-3">
            <div className="text-center mb-3">
               {editingCandidate.imageUrl && <img src={editingCandidate.imageUrl} className="rounded-3 border shadow-sm" width="100" height="100" style={{objectFit:'cover'}} alt="Preview" />}
            </div>
            
            <input className="form-control" value={editingCandidate.fullName} onChange={e => setEditingCandidate({...editingCandidate, fullName: e.target.value})} placeholder="Full Name" />
            <input className="form-control" value={editingCandidate.slogan} onChange={e => setEditingCandidate({...editingCandidate, slogan: e.target.value})} placeholder="Slogan" />
            
            <div className="input-group">
                 <input className="form-control" value={editingCandidate.imageUrl} readOnly />
                 <input type="file" ref={editFileInputRef} className="d-none" accept="image/*" onChange={(e) => handleImageSelect(e, true)} />
                 <Button variant="secondary" onClick={() => editFileInputRef.current?.click()}><Upload size={18} /></Button>
            </div>

            <textarea className="form-control" rows={4} value={editingCandidate.description} onChange={e => setEditingCandidate({...editingCandidate, description: e.target.value})} placeholder="Description" />

            <div>
               <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="small fw-bold text-muted">FILES</label>
                  <Button variant="ghost" className="p-0 text-primary" onClick={() => editDocInputRef.current?.click()}><Paperclip size={14} /> Add</Button>
                  <input type="file" ref={editDocInputRef} className="d-none" multiple onChange={(e) => handleFileSelect(e, true)} />
               </div>
               {editingCandidate.files?.map(f => (
                  <div key={f.id} className="d-flex justify-content-between align-items-center bg-light p-2 rounded border mb-1">
                    <span className="small text-truncate">{f.name}</span>
                    <X size={14} className="cursor-pointer text-danger" onClick={() => removeFile(f.id, true)}/>
                  </div>
               ))}
            </div>

            <Button onClick={updateCand} isLoading={isProcessing} className="w-100">Save Changes</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

// --- Whitelist Tab ---
const WhitelistTab = ({ electionId }: { electionId: string }) => {
  const [list, setList] = useState<WhitelistEntry[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = () => api.admin.getWhitelist(electionId).then(setList).catch(() => {});
  useEffect(() => { refresh(); }, []);

  const handleAdd = async () => {
    if(!email) return;
    setLoading(true);

    // Parse emails: split by newlines, commas, spaces.
    const rawEmails = email.split(/[\s,]+/);
    const validEmails = rawEmails
      .map(e => e.trim())
      .filter(e => e.length > 0 && e.includes('@')); // Basic validation

    const uniqueEmails = [...new Set(validEmails)]; // Dedup

    if (uniqueEmails.length === 0) {
        toast.error("No valid email addresses found.");
        setLoading(false);
        return;
    }

    if (uniqueEmails.length === 1) {
        // Single Add
        await api.admin.addToWhitelist(electionId, uniqueEmails[0]);
        toast.success("Voter authorized");
    } else {
        // Bulk Add
        const promise = api.admin.addBatchToWhitelist(electionId, uniqueEmails, (completed) => {
            // Optional progress tracking if needed
        });
        
        await toast.promise(promise, {
            loading: `Processing ${uniqueEmails.length} voters...`,
            success: `Successfully processed list`,
            error: 'Some entries might have failed'
        });
    }

    setEmail('');
    refresh();
    setLoading(false);
  };

  const handleRevoke = async (id: string) => {
    await api.admin.removeFromWhitelist(id);
    refresh();
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-header bg-white p-4 d-flex gap-3 align-items-start">
        <div className="flex-grow-1 position-relative">
            <Mail className="position-absolute top-0 mt-3 ms-3 text-muted" size={18} />
            <textarea 
              className="form-control ps-5 py-2" 
              placeholder="Add Email or Paste Bulk List (e.g. from Excel/Sheets)" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ minHeight: '45px', resize: 'vertical' }}
              rows={1}
            />
            <small className="text-muted ms-1">Supports bulk copy-paste from Excel or CSV</small>
        </div>
        <Button onClick={handleAdd} isLoading={loading}>Authorize</Button>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive" style={{maxHeight: 500}}>
           <table className="table table-hover align-middle mb-0">
             <thead className="bg-light sticky-top">
               <tr>
                 <th className="px-4 py-3 text-uppercase small text-muted">Email</th>
                 <th className="px-4 py-3 text-uppercase small text-muted">Status</th>
                 <th className="px-4 py-3 text-uppercase small text-muted">Credentials</th>
                 <th className="px-4 py-3 text-end text-uppercase small text-muted">Action</th>
               </tr>
             </thead>
             <tbody>
                {list.map(w => (
                  <tr key={w.id}>
                    <td className="px-4 fw-bold text-dark">{w.email}</td>
                    <td className="px-4">
                      {w.isRegistered 
                        ? <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3"><Check size={12} className="me-1"/> Registered</span>
                        : <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3">Pending</span>
                      }
                    </td>
                    <td className="px-4"><code className="bg-light px-2 py-1 rounded text-muted small">{w.isRegistered ? w.passwordPlain : '••••••'}</code></td>
                    <td className="px-4 text-end">
                      <button onClick={() => handleRevoke(w.id)} className="btn btn-sm btn-outline-danger border-0 bg-danger bg-opacity-10 text-danger">Revoke</button>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && <tr><td colSpan={4} className="text-center py-5 text-muted">No voters authorized.</td></tr>}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

// --- Results Tab ---
const ResultsTab = ({ electionId, status, electionTitle }: { electionId: string, status: ElectionStatus, electionTitle: string }) => {
  const [results, setResults] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showNonVoters, setShowNonVoters] = useState(false);
  const [nonVoters, setNonVoters] = useState<WhitelistEntry[]>([]);
  
  const refresh = async () => {
      const [r, p, s, w] = await Promise.all([
        api.results.getResults(electionId),
        api.admin.getPositions(electionId),
        api.results.getStats(electionId),
        api.admin.getWhitelist(electionId)
      ]);
      setResults(r);
      setPositions(p);
      setStats(s);
      setNonVoters(w.filter(x => !x.hasVoted));
  };

  useEffect(() => { refresh(); }, [status]);

  const handleResetVotes = async () => {
    if (confirm("WARNING: This will delete ALL votes cast in this election. This action cannot be undone. Voters will be able to vote again. Proceed?")) {
      const toastId = toast.loading("Resetting votes...");
      try {
        await api.admin.resetVotes(electionId);
        toast.success("All votes have been cleared", { id: toastId });
        refresh();
      } catch (e) {
        toast.error("Failed to reset votes", { id: toastId });
      }
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFontSize(22); doc.setTextColor(255, 255, 255);
    doc.text("UniVote Results", 14, 20);
    doc.setTextColor(51, 65, 85); doc.setFontSize(14);
    doc.text(`Election: ${electionTitle}`, 14, 45);
    doc.setFontSize(10); doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 52);

    const statsData = [["Authorized", stats?.total || 0], ["Votes Cast", stats?.casted || 0], ["Turnout", `${stats?.turnout || 0}%`]];
    autoTable(doc, { startY: 65, head: [['Metric', 'Value']], body: statsData });

    let lastY = (doc as any).lastAutoTable.finalY + 15;
    
    positions.forEach(p => {
      if (lastY > 250) { doc.addPage(); lastY = 20; }
      doc.setFontSize(14); doc.setTextColor(79, 70, 229); doc.text(p.title, 14, lastY);
      
      const posResults = results.filter(c => c.positionId === p.id).sort((a,b) => (b.voteCount||0) - (a.voteCount||0));
      const totalVotes = posResults.reduce((sum, c) => sum + (c.voteCount || 0), 0);
      const rows = posResults.map((c, idx) => [c.fullName, c.voteCount, `${totalVotes > 0 ? Math.round(((c.voteCount||0)/totalVotes)*100) : 0}%`, idx === 0 && c.voteCount && c.voteCount > 0 ? 'WINNER' : '']);

      autoTable(doc, { 
        startY: lastY + 5, 
        head: [['Candidate', 'Votes', '%', 'Status']], 
        body: rows,
        didParseCell: (data) => {
           if (data.section === 'body' && data.row.index === 0 && data.row.raw[3] === 'WINNER') {
              data.cell.styles.fillColor = [220, 252, 231];
           }
        }
      });
      lastY = (doc as any).lastAutoTable.finalY + 15;
    });
    doc.save('election-report.pdf');
  };

  if (status === ElectionStatus.NOT_STARTED || status === ElectionStatus.CAMPAIGN) {
    return (
       <div className="text-center py-5 border rounded-4 bg-light">
          <BarChart3 size={40} className="text-muted mb-3"/>
          <p className="text-muted fw-bold">Analytics available after voting starts.</p>
       </div>
    );
  }

  return (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-end mb-4">
         <div>
            <h4 className="fw-bold mb-0">Real-Time Analytics</h4>
            <p className="text-muted small mb-0">Live stats updates</p>
         </div>
         <div className="d-flex gap-2">
            <button onClick={handleResetVotes} className="btn btn-danger btn-sm text-white d-flex align-items-center shadow-sm border-0"><RotateCcw size={16} className="me-2"/> Reset Votes</button>
            <Button variant="secondary" onClick={() => setShowNonVoters(true)} className="btn-sm"><List size={16} className="me-2"/> Non-Voters</Button>
            <Button onClick={generatePDF} className="btn-sm"><FileDown size={16} className="me-2"/> Export PDF</Button>
         </div>
      </div>

      <div className="row g-3 mb-5">
        {[
          { label: 'Voters', value: stats?.total || 0, color: 'text-dark' },
          { label: 'Casted', value: stats?.casted || 0, color: 'text-success' },
          { label: 'Pending', value: stats?.notCasted || 0, color: 'text-warning' },
          { label: 'Turnout', value: `${stats?.turnout || 0}%`, color: 'text-primary' },
        ].map((s, i) => (
           <div key={i} className="col-6 col-md-3">
             <div className="card border-0 shadow-sm rounded-4 text-center p-3 h-100 justify-content-center">
                <small className="text-muted fw-bold text-uppercase" style={{fontSize: '0.7rem'}}>{s.label}</small>
                <h2 className={`fw-bold mb-0 ${s.color}`}>{s.value}</h2>
             </div>
           </div>
        ))}
      </div>
      
      {positions.map(p => {
         const pResults = results.filter(r => r.positionId === p.id).sort((a,b) => (b.voteCount||0) - (a.voteCount||0));
         const total = pResults.reduce((s, c) => s + (c.voteCount||0), 0) || 1;
         const winnerId = pResults[0]?.id;

         return (
           <div key={p.id} className="card border-0 shadow-sm rounded-4 mb-4">
             <div className="card-header bg-white p-3 border-bottom"><h5 className="mb-0 fw-bold">{p.title}</h5></div>
             <div className="card-body p-4">
               {pResults.map(c => {
                 const pct = Math.round(((c.voteCount||0)/total)*100);
                 const isWin = status === ElectionStatus.COMPLETED || status === ElectionStatus.ANNOUNCED ? c.id === winnerId : false;
                 return (
                   <div key={c.id} className="mb-4">
                     <div className="d-flex justify-content-between mb-2 align-items-center">
                       <div className="d-flex align-items-center gap-3">
                          <img src={c.imageUrl} width="40" height="40" className="rounded-circle bg-light" alt=""/>
                          <div>
                            <span className={`fw-bold d-block ${isWin ? 'text-primary' : 'text-dark'}`}>{c.fullName} {isWin && '🏆'}</span>
                          </div>
                       </div>
                       <div className="text-end">
                         <span className="fw-bold d-block h5 mb-0">{c.voteCount}</span>
                         <span className="small text-muted">{pct}%</span>
                       </div>
                     </div>
                     <div className="progress rounded-pill bg-light" style={{height: 10}}>
                       <div className={`progress-bar rounded-pill ${isWin ? 'bg-gradient-brand' : 'bg-secondary'}`} style={{width: `${pct}%`, transition: 'width 1s'}}></div>
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
         );
      })}

      <Modal isOpen={showNonVoters} onClose={() => setShowNonVoters(false)} title="Non-Voters List">
         <div className="table-responsive">
            <table className="table table-sm">
               <thead><tr><th>Email</th><th>Status</th></tr></thead>
               <tbody>
                  {nonVoters.map(n => (
                     <tr key={n.id}><td>{n.email}</td><td>{n.isRegistered ? 'Registered' : 'Pending'}</td></tr>
                  ))}
               </tbody>
            </table>
         </div>
      </Modal>
    </div>
  );
}

export default function ElectionControl() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState<Election | null>(null);
  const [activeTab, setActiveTab] = useState('setup');
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newDate, setNewDate] = useState('');
  
  useEffect(() => {
    if(electionId) {
      api.admin.getElectionBundle(electionId).then(d => {
        setElection(d.election);
        setNewDate(d.election.pollingDate);
      });
    }
  }, [electionId]);

  const updateStatus = async (s: ElectionStatus) => {
    if (!election) return;
    await api.admin.updateElectionStatus(election.id, s);
    setElection({...election, status: s});
  };

  const saveDate = async () => {
    if(!election) return;
    await api.admin.updateElectionDate(election.id, newDate);
    setElection({...election, pollingDate: newDate});
    setIsEditingDate(false);
  }

  if (!election) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <Layout>
      <div className="mb-4">
        <button onClick={() => navigate('/admin/dashboard')} className="btn btn-link text-decoration-none text-muted mb-3 ps-0 d-flex align-items-center">
          <ArrowLeft size={18} className="me-2"/> Back to Dashboard
        </button>
        
        <div className="card border-0 shadow-medium rounded-5 p-4 bg-white position-relative overflow-hidden">
          <div className="position-absolute top-0 end-0 bg-primary opacity-10 rounded-circle" style={{width: 300, height: 300, transform: 'translate(30%, -30%)'}}></div>
          
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 position-relative z-1">
             <div>
               <h2 className="fw-bold mb-2 text-dark">{election.title}</h2>
               <div className="d-flex gap-3 align-items-center">
                  {isEditingDate ? (
                     <div className="d-flex gap-1 align-items-center bg-light p-1 rounded">
                        <input type="date" className="form-control form-control-sm border-0 bg-transparent" value={newDate} onChange={e => setNewDate(e.target.value)} />
                        <button className="btn btn-sm btn-success p-1" onClick={saveDate}><Check size={14}/></button>
                        <button className="btn btn-sm btn-danger p-1" onClick={() => setIsEditingDate(false)}><X size={14}/></button>
                     </div>
                  ) : (
                     <span className="text-muted small cursor-pointer hover-text-primary d-flex align-items-center" onClick={() => setIsEditingDate(true)}>
                        <Calendar size={14} className="me-1"/> {new Date(election.pollingDate).toLocaleDateString()} <Edit2 size={10} className="ms-1"/>
                     </span>
                  )}
                  <span className="text-muted small">|</span>
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">{election.status.replace('_', ' ')}</span>
               </div>
             </div>
             
             <div className="d-flex flex-wrap gap-2">
               {[ElectionStatus.NOT_STARTED, ElectionStatus.CAMPAIGN, ElectionStatus.LIVE, ElectionStatus.COMPLETED, ElectionStatus.ANNOUNCED].map(s => (
                 <button 
                    key={s} 
                    onClick={() => updateStatus(s)} 
                    className={`btn btn-sm fw-bold rounded-pill px-3 ${election.status === s ? 'btn-primary shadow-sm' : 'btn-light text-muted bg-white border'}`}
                  >
                   {s.replace('_', ' ')}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>

      <ul className="nav nav-pills mb-4 gap-2 p-2 bg-white rounded-pill shadow-sm d-inline-flex">
        <li className="nav-item">
          <button className={`nav-link rounded-pill px-4 d-flex align-items-center gap-2 ${activeTab === 'setup' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('setup')}>
            <FileText size={16}/> Setup
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link rounded-pill px-4 d-flex align-items-center gap-2 ${activeTab === 'whitelist' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('whitelist')}>
            <Users size={16}/> Voters
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link rounded-pill px-4 d-flex align-items-center gap-2 ${activeTab === 'results' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('results')}>
            <BarChart3 size={16}/> Results
          </button>
        </li>
      </ul>

      <div className="animate__animated animate__fadeIn">
        {activeTab === 'setup' && <SetupTab electionId={election.id} />}
        {activeTab === 'whitelist' && <WhitelistTab electionId={election.id} />}
        {activeTab === 'results' && <ResultsTab electionId={election.id} status={election.status} electionTitle={election.title} />}
      </div>
    </Layout>
  );
}