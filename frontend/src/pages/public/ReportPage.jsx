import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';

export default function ReportPage() {
  const { matchId }       = useParams();
  const [report, setReport] = useState(null);
  const [error, setError]   = useState('');

  useEffect(() => {
    api.get(`/api/admin/reports/${matchId}`)
      .then(r => setReport(r.data))
      .catch(() => setError('Report not found for this match.'));
  }, [matchId]);

  return (
    <div className="page">
      <h1>Match Report</h1>
      {error && <p className="error">{error}</p>}
      {report && (
        <div className="report-card">
          <p>{report.summary}</p>
          <small>Created: {new Date(report.created_at).toLocaleString()}</small>
        </div>
      )}
    </div>
  );
}
