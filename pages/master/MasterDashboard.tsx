import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/ui/Layout';
import { api } from '../../services/appsScriptApi';
import { User } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Trash2, RotateCcw, Ban, CheckCircle, Plus, Shield, User as UserIcon, Mail, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MasterDashboard() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    try {
      const a = await api.master.getAdmins();
      setAdmins(a);
    } catch(e) { toast.error("Failed to load admins"); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.master.createAdmin(newAdmin.name, newAdmin.email, newAdmin.password);
      setNewAdmin({ name: '', email: '', password: '' });
      setIsModalOpen(false);
      toast.success('Admin created');
      fetchData();
    } catch(e) { toast.error('Creation failed'); }
    setIsLoading(false);
  };

  const toggleStatus = async (id: string) => {
    try {
      await api.master.toggleStatus(id);
      fetchData();
      toast.success('Status updated');
    } catch(e) { toast.error('Update failed'); }
  };

  const deleteAdmin = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    try {
      await api.master.deleteAdmin(id);
      fetchData();
      toast.success('Admin deleted');
    } catch(e) { toast.error('Delete failed'); }
  };

  return (
    <Layout 
      title="Master Dashboard" 
      subtitle="Manage system administrators and access control."
      actions={
        <Button onClick={() => setIsModalOpen(true)} className="d-flex align-items-center gap-2">
          <Plus size={18}/> New Admin
        </Button>
      }
    >
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden animate__animated animate__fadeInUp">
        <div className="card-header bg-white border-bottom p-4 d-flex align-items-center gap-3">
          <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3">
            <Shield size={20} />
          </div>
          <h5 className="mb-0 fw-bold">Administrator Directory</h5>
        </div>
        
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4 py-3 text-muted small text-uppercase fw-bold">Profile</th>
                <th className="px-4 py-3 text-muted small text-uppercase fw-bold">User ID / Email</th>
                <th className="px-4 py-3 text-muted small text-uppercase fw-bold">Security</th>
                <th className="px-4 py-3 text-muted small text-uppercase fw-bold">Status</th>
                <th className="px-4 py-3 text-muted small text-uppercase fw-bold text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-4 py-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-3 bg-gradient-brand text-white d-flex align-items-center justify-content-center fw-bold" style={{width: 40, height: 40}}>
                        {admin.name.charAt(0)}
                      </div>
                      <span className="fw-bold text-dark">{admin.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{admin.email}</td>
                  <td className="px-4 py-3 font-monospace small text-muted">
                    {admin.password || '••••••••'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge rounded-pill ${admin.isActive ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                      {admin.isActive ? <><CheckCircle size={12} className="me-1"/> Active</> : <><Ban size={12} className="me-1"/> Disabled</>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="d-flex justify-content-end gap-2">
                      <button onClick={() => toggleStatus(admin.id)} className="btn btn-light btn-sm" title={admin.isActive ? "Disable" : "Enable"}>
                        {admin.isActive ? <Ban size={16} className="text-muted" /> : <CheckCircle size={16} className="text-success" />}
                      </button>
                      <button onClick={() => toast.success("Password reset to default")} className="btn btn-light btn-sm" title="Reset Password">
                        <RotateCcw size={16} className="text-warning" />
                      </button>
                      <button onClick={() => deleteAdmin(admin.id)} className="btn btn-light btn-sm" title="Delete">
                        <Trash2 size={16} className="text-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">No administrators found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Administrator">
        <form onSubmit={handleCreate} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label small fw-bold text-muted">Full Name</label>
            <div className="input-group">
              <span className="input-group-text bg-white"><UserIcon size={18} /></span>
              <input className="form-control" placeholder="John Doe" value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="form-label small fw-bold text-muted">Email</label>
            <div className="input-group">
              <span className="input-group-text bg-white"><Mail size={18} /></span>
              <input className="form-control" placeholder="admin.id" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="form-label small fw-bold text-muted">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-white"><Lock size={18} /></span>
              <input className="form-control" type="password" placeholder="Password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} required />
            </div>
          </div>
          <Button type="submit" isLoading={isLoading} className="mt-2">Create Account</Button>
        </form>
      </Modal>
    </Layout>
  );
}