import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Activity, Clock, MousePointerClick, 
  TrendingUp, Monitor, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import clsx from 'clsx';

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [liveData, setLiveData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, liveRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard/stats`),
          axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard/live`)
        ]);
        setStats(statsRes.data);
        setLiveData(liveRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Simulate real-time updates every 30s
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Mock data for charts
  const activityData = [
    { time: '09:00', active: 45, idle: 12 },
    { time: '10:00', active: 52, idle: 8 },
    { time: '11:00', active: 58, idle: 5 },
    { time: '12:00', active: 30, idle: 35 },
    { time: '13:00', active: 48, idle: 15 },
    { time: '14:00', active: 55, idle: 10 },
    { time: '15:00', active: 50, idle: 18 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Company Overview</h1>
          <p className="text-slate-400 text-sm">Real-time productivity and activity metrics</p>
        </div>
        <div className="flex gap-3">
          <div className="glass px-4 py-2 rounded-lg text-sm font-medium text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Sync: Active
          </div>
          <button className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary-500/20">
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Online" 
          value={`${stats?.onlineEmployees || 0} / ${stats?.totalEmployees || 0}`}
          subtitle="Employees currently active"
          icon={<Users className="h-5 w-5 text-indigo-400" />}
          trend="+12% vs yesterday"
          trendUp={true}
          color="indigo"
        />
        <StatCard 
          title="Avg Productivity" 
          value={`${stats?.avgProductivity || 0}%`}
          subtitle="Based on classification rules"
          icon={<Activity className="h-5 w-5 text-green-400" />}
          trend="+5.2% vs last week"
          trendUp={true}
          color="green"
        />
        <StatCard 
          title="Total Hours tracked" 
          value={`${stats?.totalHours || 0}h`}
          subtitle="Across all departments today"
          icon={<Clock className="h-5 w-5 text-blue-400" />}
          trend="+1.5h vs yesterday avg"
          trendUp={true}
          color="blue"
        />
        <StatCard 
          title="Active App Transitions" 
          value="1,245"
          subtitle="Window switches per hour"
          icon={<MousePointerClick className="h-5 w-5 text-orange-400" />}
          trend="-2% vs yesterday"
          trendUp={false}
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Productivity Activity Chart */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-400" />
                Activity Trend
              </h2>
              <select className="bg-surface border border-slate-700 text-sm rounded-lg px-3 py-1.5 text-slate-300 outline-none focus:border-primary-500">
                <option>Today</option>
                <option>Yesterday</option>
                <option>This Week</option>
              </select>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorIdle" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                  <Area type="monotone" dataKey="idle" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorIdle)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Live User Activity Table */}
          <div className="glass-card p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Monitor className="h-5 w-5 text-indigo-400" />
                Live Employee Status
              </h2>
              <button className="text-sm text-primary-400 hover:text-primary-300 flex items-center font-medium transition-colors">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-800/50 text-xs uppercase font-medium text-slate-300">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Current App</th>
                    <th className="px-6 py-4 text-right">Hours Today</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {liveData.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium text-xs">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-200">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.department}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "px-2.5 py-1 rounded-full text-xs font-medium border flex w-fit items-center gap-1.5",
                          user.status === 'Active' ? "bg-green-500/10 text-green-400 border-green-500/20" : 
                          user.status === 'Idle' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : 
                          "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        )}>
                          <span className={clsx("w-1.5 h-1.5 rounded-full",
                            user.status === 'Active' ? "bg-green-400" : 
                            user.status === 'Idle' ? "bg-orange-400" : "bg-slate-400"
                          )}></span>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-300">{user.currentApp}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-slate-200">{user.todayHours}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-6">
          
          {/* Top Apps Widget */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Top Applications</h2>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.topApps || []} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} hide />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <RechartsTooltip 
                    cursor={{fill: '#334155', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  />
                  <Bar dataKey="usage" radius={[0, 4, 4, 0]}>
                    {
                      (stats?.topApps || []).map((entry, index) => {
                        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];
                        return <cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center justify-between">
              Activity Feed
              <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded-md">Live</span>
            </h2>
            <div className="space-y-4">
              {(stats?.recentActivity || []).map((item, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== (stats?.recentActivity || []).length - 1 && (
                    <div className="absolute top-8 bottom-[-16px] left-[15px] w-px bg-slate-700"></div>
                  )}
                  <div className="w-8 h-8 rounded-full bg-surface border border-slate-700 flex items-center justify-center shrink-0 z-10">
                    <CheckCircle2 className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-sm text-slate-300">
                      <span className="font-medium text-white">{item.user}</span>{' '}
                      {item.action.toLowerCase()}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 rounded-lg border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">
              View Full Log
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// Simple Stat Card Component
function StatCard({ title, value, subtitle, icon, trend, trendUp, color }) {
  const colorMap = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  };

  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
        <div className="w-24 h-24">{icon}</div>
      </div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
        </div>
        <div className={clsx("p-2.5 rounded-xl border", colorMap[color])}>
          {icon}
        </div>
      </div>
      <div className="flex items-center gap-2 relative z-10">
        <span className={clsx(
          "text-xs font-semibold px-2 py-0.5 rounded-md",
          trendUp ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
        )}>
          {trend}
        </span>
        <span className="text-xs text-slate-500 block truncate">{subtitle}</span>
      </div>
    </div>
  );
}
