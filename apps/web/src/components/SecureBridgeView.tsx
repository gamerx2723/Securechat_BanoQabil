import React, { useState } from 'react';
import {
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  History,
  Trash2,
  ExternalLink,
  MessageSquare,
  Radio,
  Eye,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Bell
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { SecurityAnalysis } from '../types';

interface CapturedNotification {
  id: string;
  appName: 'WhatsApp' | 'Telegram' | 'SMS' | 'Signal';
  sender: string;
  text: string;
  timestamp: string;
  isDeletedBySender: boolean;
  securityAnalysis: SecurityAnalysis;
}

export const SecureBridgeView: React.FC = () => {
  const [filterType, setFilterType] = useState<'ALL' | 'CRITICAL' | 'DELETED' | 'WHATSAPP'>('ALL');
  const [simText, setSimText] = useState('');
  const [simSender, setSimSender] = useState('+92 300 1234567');
  const [simApp, setSimApp] = useState<'WhatsApp' | 'Telegram' | 'SMS'>('WhatsApp');
  const [simDeleted, setSimDeleted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeInspect, setActiveInspect] = useState<CapturedNotification | null>(null);

  // Pre-seeded realistic companion captures
  const [captures, setCaptures] = useState<CapturedNotification[]>([
    {
      id: 'bridge-1',
      appName: 'WhatsApp',
      sender: 'BISP Helpline (+92 301 8899221)',
      text: 'Mubarak Ho! Apka 25000 Ehsaas Rashan Program mein manzoor ho gaya hai. Abhi verify karne k liye is link par click karein: http://ehsaas-bisp-relief.xyz/verify',
      timestamp: '10:45 AM',
      isDeletedBySender: false,
      securityAnalysis: ApiClient.clientSideEvaluate('Mubarak Ho! Apka 25000 Ehsaas Rashan Program mein manzoor ho gaya hai. Abhi verify karne k liye is link par click karein: http://ehsaas-bisp-relief.xyz/verify'),
    },
    {
      id: 'bridge-2',
      appName: 'WhatsApp',
      sender: 'Unknown Contact (+92 312 9988776)',
      text: 'This message was deleted on WhatsApp by sender: "Teri pictures social media par viral kar dunga agar 20000 jazzcash na kiye foran."',
      timestamp: '09:15 AM',
      isDeletedBySender: true,
      securityAnalysis: ApiClient.clientSideEvaluate('Teri pictures social media par viral kar dunga agar 20000 jazzcash na kiye foran.'),
    },
    {
      id: 'bridge-3',
      appName: 'SMS',
      sender: 'HBL Bank Alert',
      text: 'Dear Customer, your debit card ending in 4092 is temporarily blocked. Verify immediately at http://hbl-login-portal.site or call helpline.',
      timestamp: 'Yesterday',
      isDeletedBySender: false,
      securityAnalysis: ApiClient.clientSideEvaluate('Dear Customer, your debit card ending in 4092 is temporarily blocked. Verify immediately at http://hbl-login-portal.site or call helpline.'),
    },
    {
      id: 'bridge-4',
      appName: 'WhatsApp',
      sender: 'Family Group (Ammi)',
      text: 'Assalam o alaikum beta, ghar aatay waqt dahi le aana.',
      timestamp: 'Yesterday',
      isDeletedBySender: false,
      securityAnalysis: ApiClient.clientSideEvaluate('Assalam o alaikum beta, ghar aatay waqt dahi le aana.'),
    }
  ]);

  const handleSimulateCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim()) return;

    setIsScanning(true);
    const analysis = await ApiClient.analyzePreSend(simText);
    setIsScanning(false);

    const newCapture: CapturedNotification = {
      id: `bridge-${Date.now()}`,
      appName: simApp,
      sender: simSender,
      text: simDeleted ? `[Deleted on ${simApp} by sender]: "${simText}"` : simText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDeletedBySender: simDeleted,
      securityAnalysis: analysis,
    };

    setCaptures([newCapture, ...captures]);
    setSimText('');
  };

  const filteredCaptures = captures.filter((c) => {
    if (filterType === 'CRITICAL') return c.securityAnalysis.indicatorColor === 'RED' || c.securityAnalysis.indicatorColor === 'ORANGE';
    if (filterType === 'DELETED') return c.isDeletedBySender;
    if (filterType === 'WHATSAPP') return c.appName === 'WhatsApp';
    return true;
  });

  const criticalCount = captures.filter(c => c.securityAnalysis.indicatorColor === 'RED').length;
  const deletedCount = captures.filter(c => c.isDeletedBySender).length;

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        background: 'radial-gradient(ellipse at 80% 20%, rgba(16, 185, 129, 0.08), transparent 50%)',
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
            }}
          >
            <Smartphone size={26} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>SecureBridge Companion</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                SRS Product B (§30–34)
              </span>
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Cross-app external notification intelligence & deleted message forensic preservation for WhatsApp, Telegram & SMS.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--red-danger)' }}>{criticalCount}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Threats Intercepted</div>
          </div>
          <div
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8' }}>{deletedCount}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deleted Vault Recoveries</div>
          </div>
        </div>
      </div>

      {/* Simulator Section */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
          <Radio size={16} style={{ color: '#10b981' }} />
          <span>Simulate External App Notification Ingestion (Android Notification Listener Pipeline)</span>
        </div>

        <form onSubmit={handleSimulateCapture} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={simApp}
              onChange={(e: any) => setSimApp(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="WhatsApp">WhatsApp Notification</option>
              <option value="Telegram">Telegram Notification</option>
              <option value="SMS">SMS / Smishing</option>
            </select>

            <input
              type="text"
              placeholder="Sender Phone / Name (e.g. +92 300 1234567)"
              value={simSender}
              onChange={(e) => setSimSender(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={simDeleted}
                onChange={(e) => setSimDeleted(e.target.checked)}
              />
              <span>Simulate Sender "Delete For Everyone"</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Paste notification message text (e.g. 'Aapka 50,000 ka inaam nikla hai http://scam.xyz')"
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />

            <button
              type="submit"
              disabled={isScanning || !simText.trim()}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: (isScanning || !simText.trim()) ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isScanning ? <RefreshCw size={14} className="spin" /> : <Bell size={14} />}
              <span>Ingest & Scan</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
        {[
          { id: 'ALL', label: `All Captured (${captures.length})` },
          { id: 'CRITICAL', label: `Threat Alerts (${criticalCount})` },
          { id: 'DELETED', label: `Deleted Intelligence (${deletedCount})` },
          { id: 'WHATSAPP', label: 'WhatsApp Only' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterType(t.id as any)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: filterType === t.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              border: filterType === t.id ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
              color: filterType === t.id ? '#10b981' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Captured Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredCaptures.map((item) => {
          const isRed = item.securityAnalysis.indicatorColor === 'RED';
          const isOrange = item.securityAnalysis.indicatorColor === 'ORANGE';
          const isGreen = item.securityAnalysis.indicatorColor === 'GREEN';

          return (
            <div
              key={item.id}
              style={{
                background: isRed
                  ? 'rgba(239, 68, 68, 0.06)'
                  : isOrange
                  ? 'rgba(245, 158, 11, 0.06)'
                  : 'rgba(15, 23, 42, 0.45)',
                border: isRed
                  ? '1px solid rgba(239, 68, 68, 0.4)'
                  : isOrange
                  ? '1px solid rgba(245, 158, 11, 0.4)'
                  : '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: item.appName === 'WhatsApp' ? 'rgba(37, 211, 102, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: item.appName === 'WhatsApp' ? '#25D366' : '#38bdf8',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {item.appName}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.sender}
                  </span>
                  {item.isDeletedBySender && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: 'var(--red-danger)',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <History size={12} />
                      <span>DELETED MESSAGE INTELLIGENCE</span>
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.timestamp}</span>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: isRed ? 'rgba(239, 68, 68, 0.2)' : isOrange ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: isRed ? 'var(--red-danger)' : isOrange ? 'var(--orange-warn)' : 'var(--green-safe)',
                      border: isRed ? '1px solid rgba(239, 68, 68, 0.4)' : isOrange ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    {isGreen ? 'SAFE' : `${item.securityAnalysis.riskScore}% RISK`}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                {item.text}
              </div>

              {/* Threat Breakdown if flagged */}
              {!isGreen && item.securityAnalysis.evidenceList.length > 0 && (
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: isRed ? '#fca5a5' : '#fcd34d',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>⚠️ Cross-App Security Alert:</div>
                  <div>{item.securityAnalysis.explanation}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
