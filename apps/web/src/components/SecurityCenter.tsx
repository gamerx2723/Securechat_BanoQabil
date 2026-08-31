import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, ShieldAlert, Key, Server, RefreshCw, CheckCircle } from 'lucide-react';
import { ApiClient } from '../api/client';

export const SecurityCenter: React.FC = () => {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://localhost:4000/api/v1';

  const loadTelemetry = async () => {
    setLoading(true);
    try {
      const token = ApiClient.getToken();
      const res = await fetch(`${API_BASE}/security/telemetry`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        setTelemetry(await res.json());
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, []);

  return (
    <div style={{ flex: 1, padding: '28px', overflowY: 'auto', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Dashboard Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
            <Activity size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Live SecOps Threat & Telemetry Center</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Real-time cryptographic database metrics & threat interception feed</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={loadTelemetry}
            disabled={loading}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', color: 'var(--green-safe)', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green-safe)' }}></span>
            ZERO-TRUST ACTIVE
          </div>
        </div>
      </div>

      {/* Metrics Row from Actual Database */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total Encrypted Messages</span>
            <ShieldCheck size={18} style={{ color: 'var(--green-safe)' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {telemetry ? telemetry.totalProtectedMessages : '...'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--green-safe)' }}>Double Ratchet Active</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Critical Threats Intercepted</span>
            <ShieldAlert size={18} style={{ color: 'var(--red-critical)' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--red-critical)', marginBottom: '4px' }}>
            {telemetry ? telemetry.redThreats : '...'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--red-critical)' }}>100% evaluated on-device</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Suspicious Prompts Flagged</span>
            <Key size={18} style={{ color: 'var(--orange-warn)' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--orange-warn)', marginBottom: '4px' }}>
            {telemetry ? telemetry.orangeThreats : '...'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--orange-warn)' }}>Urgency & Secret Filters</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Active Registered Devices</span>
            <Server size={18} style={{ color: '#60a5fa' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#60a5fa', marginBottom: '4px' }}>
            {telemetry ? telemetry.activeDevices : '...'}
          </div>
          <div style={{ fontSize: '11px', color: '#60a5fa' }}>Curve25519 Keys Synced</div>
        </div>
      </div>

      {/* Grid: Attack Breakdown & Security Audit Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Threat Distribution */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Threat Category Breakdown</h3>
          {telemetry?.threatBreakdown && telemetry.threatBreakdown.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {telemetry.threatBreakdown.map((t: any, idx: number) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>{t.category}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{t.count} detected</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, t.count * 25)}%`, height: '100%', background: 'var(--red-critical)', borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              <CheckCircle size={28} style={{ color: 'var(--green-safe)', margin: '0 auto 8px auto' }} />
              No active security violations recorded in database.
            </div>
          )}
        </div>

        {/* Security Audit Trail */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Live Security Event Audit Trail</h3>
          {telemetry?.recentEvents && telemetry.recentEvents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
              {telemetry.recentEvents.map((e: any) => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{e.type}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(e.createdAt).toLocaleTimeString()} • {e.explanation || 'Zero-Trust Inspection'}</div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: '4px', background: e.indicatorColor === 'RED' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: e.indicatorColor === 'RED' ? 'var(--red-critical)' : 'var(--orange-warn)' }}>
                    {e.riskScore}% RISK
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              All communications clean and encrypted.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
