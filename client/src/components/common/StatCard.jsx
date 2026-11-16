// components/common/StatCard.jsx — Kartu metrik dashboard

export default function StatCard({ title, value, icon: Icon, color = 'orange', sub, badge }) {
  const colorMap = {
    orange: { bg: 'bg-orange-50',  icon: 'bg-primary-500 text-white',  text: 'text-primary-600' },
    yellow: { bg: 'bg-amber-50',   icon: 'bg-amber-400 text-white',    text: 'text-amber-600'   },
    red:    { bg: 'bg-red-50',     icon: 'bg-red-500 text-white',      text: 'text-red-600'     },
    green:  { bg: 'bg-green-50',   icon: 'bg-green-500 text-white',    text: 'text-green-600'   },
    blue:   { bg: 'bg-blue-50',    icon: 'bg-blue-500 text-white',     text: 'text-blue-600'    },
  };
  const c = colorMap[color] || colorMap.orange;

  return (
    <div className={`card ${c.bg} border-0`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`mt-1 text-3xl font-bold ${c.text}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${c.icon}`}>
          <Icon size={22} />
        </div>
      </div>
      {badge && <div className="mt-3">{badge}</div>}
    </div>
  );
}

