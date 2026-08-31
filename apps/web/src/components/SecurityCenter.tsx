import React from 'react';
import { Activity, ShieldCheck, ShieldAlert, AlertTriangle, Key, Users, Server, Database, CheckCircle } from 'lucide-react';

export const SecurityCenter: React.FC = () => {
  return (
    <div style={{ flex: 1, padding: '28px', overflowY: 'auto', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Dashboard Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
            <Activity size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>SecOps Threat & Telemetry Center</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Zero-Trust cryptographic health & threat interception overview</p>
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', color: 'var(--green-safe)', fontWeight: 600 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green-safe)' }}></span>
          SYSTEM HEALTH: 100% NOMINAL
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { title: 'Total Protected Messages', count: '1,429', change: '+12% today', icon: ShieldCheck, color: 'var(--green-safe)' },
          { title: 'Phishing Attacks Blocked', count: '48', change: '100% intercepted', icon: ShieldAlert, color: 'var(--red-critical)' },
          { title: 'DLP Leaks Mitigated', count: '19', change: 'Zero plaintexts exposed', icon: Key, color: 'var(--orange-warn)' },
          { title: 'Active E2EE Devices', count: '3', change: 'Signal Ratchet Sync', icon: Server, color: '#60a5fa' },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>{m.title}</span>
                <Icon size={18} style={{ color: m.color }} />
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {m.count}
              </div>
              <div style={{ fontSize: '11px', color: m.color }}>{m.change}</div>
            </div>
          );
        })}
      </div>

      {/* Grid: Attack Breakdown & Security Audit Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Threat Distribution */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Threat Category Interceptions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Homoglyph & Deceptive URLs', percentage: 42, count: '20 blocked', color: 'var(--red-critical)' },
              { label: 'Urgency & Fear Manipulation', percentage: 28, count: '13 blocked', color: 'var(--orange-warn)' },
              { label: 'DLP Secret & API Key Leaks', percentage: 18, count: '9 blocked', color: 'var(--accent-cyan)' },
              { label: 'Credential Harvesting Solicitation', percentage: 12, count: '6 blocked', color: 'var(--accent-purple)' },
            ].map((t, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>{t.label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{t.count} ({t.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${t.percentage}%`, height: '100%', background: t.color, borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Audit Trail */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Immutable Security Event Audit</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { time: 'Just now', event: 'Outbound AWS Key scan executed', status: 'MITIGATED', color: 'var(--green-safe)' },
              { time: '2m ago', event: 'Phishing domain paypa1.xyz intercepted', status: 'BLOCKED', color: 'var(--red-critical)' },
              { time: '14m ago', event: 'X3DH Ratchet Turn Session renewed', status: 'VERIFIED', color: '#60a5fa' },
              { time: '1h ago', event: 'Prekey bundle replenishment registered', status: 'COMPLETED', color: 'var(--green-safe)' },
            ].map((e, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', fontSize: '12px' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{e.event}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{e.time}</div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', color: e.color }}>
                  {e.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
