import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoCheckmarkOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';
import api from '../../api/axios';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    api.get('/admin/reports').then(r => setReports(r.data)).finally(() => setLoading(false));
  }, []);

  const handleResolve = async (id) => {
    setProcessing(id);
    try {
      await api.put(`/admin/reports/${id}/resolve`);
      setReports(prev => prev.filter(r => r.id !== id));
      toast.success('Report resolved');
    } catch { toast.error('Failed'); } finally { setProcessing(null); }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black gradient-text">Reports</h1>
        <p className="text-white/40 text-sm mt-0.5">{reports.length} pending reports</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16"><div className="text-5xl mb-4">✅</div><p className="text-white/40">No pending reports</p></div>
      ) : (
        <div className="space-y-4">
          {reports.map((report, i) => (
            <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-2xl p-5 border border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="tag capitalize">{report.type}</span>
                    <span className="text-xs text-white/30">#{report.reference_id}</span>
                  </div>
                  <p className="text-sm text-white/70 mb-2">{report.reason || 'No reason provided'}</p>
                  <p className="text-xs text-white/30">Reported by @{report.reporter_username} · {formatDate(report.created_at)}</p>
                </div>
                <button onClick={() => handleResolve(report.id)} disabled={processing === report.id} className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 text-green-400 rounded-xl text-xs font-medium hover:bg-green-500/20 transition-colors border border-green-500/20 flex-shrink-0">
                  <IoCheckmarkOutline size={13} /> Resolve
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
