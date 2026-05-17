/**
 * AlertBanner
 * Displays a list of unacknowledged alerts with dismissal.
 * @param {Array}    alerts    - alert objects from the API
 * @param {Function} onDismiss - called with alert id when dismissed
 */
export default function AlertBanner({ alerts = [], onDismiss }) {
  if (!alerts.length) return null;

  return (
    <div className="alert-banner mb-4" id="alert-banner">
      {alerts.map((a, idx) => (
        <div key={a.id} className="alert-item" id={`alert-item-${a.id}`}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flex: 1 }}>
            {/* Icon */}
            <span style={{ fontSize: '1.1rem', lineHeight: 1.4, flexShrink: 0 }}>
              {a.alertType === 'drop'   ? '📉' :
               a.alertType === 'growth' ? '📈' : '📊'}
            </span>
            <div>
              <p className="alert-message">{a.message}</p>
              <p className="alert-rec">
                <strong>Recommendation:</strong> {a.recommendation}
              </p>
            </div>
          </div>
          {onDismiss && (
            <button
              id={`dismiss-alert-${a.id}`}
              className="alert-dismiss"
              onClick={() => onDismiss(a.id)}
              title="Dismiss alert"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
