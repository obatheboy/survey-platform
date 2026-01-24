import './TrustBadges.css';

export default function TrustBadges({ variant = 'default' }) {
  const badges = [
    {
      icon: '🔒',
      title: 'Secure Payments',
      description: '256-bit Encryption'
    },
    {
      icon: '✓',
      title: 'Verified Platform',
      description: 'Registered & Licensed'
    },
    {
      icon: '👥',
      title: '15,000+ Users',
      description: 'Active Community'
    },
    {
      icon: '💰',
      title: 'KES 12M+ Paid',
      description: 'Total Withdrawals'
    },
    {
      icon: '⚡',
      title: 'Instant Withdrawals',
      description: '24-48 Hours'
    },
    {
      icon: '⭐',
      title: '4.8/5 Rating',
      description: '2,341 Reviews'
    }
  ];

  return (
    <div className={`trust-badges ${variant}`}>
      {badges.map((badge, index) => (
        <div key={index} className="trust-badge">
          <div className="badge-icon">{badge.icon}</div>
          <div className="badge-content">
            <h4>{badge.title}</h4>
            <p>{badge.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
