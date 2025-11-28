import { useState, useEffect } from "react";
import { Zap, Leaf, Activity, TrendingUp, Cloud, Wind, Sun, LogOut, AlertTriangle } from "lucide-react";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_BASE = "http://127.0.0.1:8000";

interface DashboardStats {
  total_delivered_kwh: number;
  renewable_users: number;
  conventional_users: number;
  paused_users: number;
  active_load_kw: number;
  grid_capacity_kw: number;
  solar_now_kw: number;
  wind_now_kw: number;
  net_green_available_kw: number;
  system_health: {
    green_score: number;
  };
  live_sessions: Array<{
    slot_id: number;
    vehicle_number: string;
    mode: string;
    current_source: string;
  }>;
}

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Check for existing auth token on mount
  useEffect(() => {
    console.log("🔐 [ADMIN] Checking for existing auth token...");
    const token = localStorage.getItem("admin_token");
    if (token) {
      console.log("✅ [ADMIN] Found existing token, auto-authenticating");
      setIsAuthenticated(true);
    } else {
      console.log("❌ [ADMIN] No token found, showing login screen");
    }
  }, []);

  // Real-time polling
  useEffect(() => {
    if (!isAuthenticated) return;
    console.log("📊 [ADMIN] Starting real-time polling...");

    const fetchStats = async () => {
      console.log("🔄 [ADMIN] Fetching dashboard stats...");
      try {
        const response = await axios.get(`${API_BASE}/admin/dashboard_stats`);
        console.log("✅ [ADMIN] Stats fetched successfully:", response.data);
        setStats(response.data);
      } catch (error) {
        console.error("❌ [ADMIN] Failed to fetch stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 2000);

    return () => {
      console.log("🛑 [ADMIN] Stopping real-time polling");
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔐 [ADMIN] Login attempt:", { username });
    setLoginLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/admin/login`, {
        username,
        password,
      });
      console.log("✅ [ADMIN] Login successful:", response.data);
      localStorage.setItem("admin_token", response.data.token);
      setIsAuthenticated(true);
      toast.success("Login successful!");
    } catch (error: any) {
      console.error("❌ [ADMIN] Login failed:", error.response?.data);
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <Activity className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Portal</h1>
            <p className="text-muted-foreground">EcoCharge AI Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:border-primary focus:outline-none transition-colors"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:border-primary focus:outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loginLoading}>
              {loginLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 spinner" />
      </div>
    );
  }

  const capacityPercent = (stats.active_load_kw / stats.grid_capacity_kw) * 100;
  const isHighLoad = capacityPercent > 70;

  const pieData = [
    { name: "Renewable", value: stats.renewable_users, color: "hsl(var(--renewable))" },
    { name: "Conventional", value: stats.conventional_users, color: "hsl(var(--conventional))" },
    { name: "Paused", value: stats.paused_users, color: "hsl(var(--paused))" },
  ];

  const getScoreColor = (score: number) => {
    if (score > 80) return "text-renewable";
    if (score > 50) return "text-paused";
    return "text-conventional";
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Real-time grid monitoring</p>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Load */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Active Load</h3>
              {isHighLoad && <AlertTriangle className="w-5 h-5 text-conventional animate-pulse" />}
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24">
                <svg className="transform -rotate-90" width="96" height="96">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="hsl(var(--border))"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={isHighLoad ? "hsl(var(--conventional))" : "hsl(var(--primary))"}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - capacityPercent / 100)}`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xl font-bold ${isHighLoad ? "text-conventional" : "text-primary"}`}>
                    {Math.round(capacityPercent)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stats.active_load_kw}</p>
                <p className="text-sm text-muted-foreground">/ {stats.grid_capacity_kw} kW</p>
              </div>
            </div>
          </div>

          {/* Green Score */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Green Score</h3>
            <div className="flex items-center gap-3">
              <Leaf className={`w-12 h-12 ${getScoreColor(stats.system_health.green_score)}`} />
              <div>
                <p className={`text-5xl font-bold ${getScoreColor(stats.system_health.green_score)}`}>
                  {stats.system_health.green_score}
                </p>
                <p className="text-sm text-muted-foreground">out of 100</p>
              </div>
            </div>
          </div>

          {/* Total Energy */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Total Energy Delivered</h3>
            <div className="flex items-center gap-3">
              <Zap className="w-12 h-12 text-primary" />
              <div>
                <p className="text-5xl font-bold text-foreground">{stats.total_delivered_kwh.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">kWh</p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Energy Mix Chart */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Energy Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Weather Widget */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Renewable Sources</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Sun className="w-8 h-8 text-paused" />
                  <div>
                    <p className="font-semibold text-foreground">Solar</p>
                    <p className="text-sm text-muted-foreground">Current Output</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.solar_now_kw} kW</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Wind className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Wind</p>
                    <p className="text-sm text-muted-foreground">Current Output</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.wind_now_kw} kW</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-renewable/10 rounded-lg glow-green">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-renewable" />
                  <div>
                    <p className="font-semibold text-foreground">Net Green Available</p>
                    <p className="text-sm text-muted-foreground">Total Capacity</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-renewable">{stats.net_green_available_kw} kW</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Sessions */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Live Charging Sessions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Slot</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vehicle</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mode</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Source</th>
                </tr>
              </thead>
              <tbody>
                {stats.live_sessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground">
                      No active sessions
                    </td>
                  </tr>
                ) : (
                  stats.live_sessions.map((session) => {
                    const isRenewable = session.current_source.includes("RENEWABLE");
                    return (
                      <tr
                        key={session.slot_id}
                        className="border-b border-border hover:bg-secondary/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-bold text-primary">#{session.slot_id}</span>
                        </td>
                        <td className="py-3 px-4 text-foreground font-mono">{session.vehicle_number}</td>
                        <td className="py-3 px-4 text-foreground">{session.mode}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              isRenewable
                                ? "bg-renewable/20 text-renewable"
                                : "bg-conventional/20 text-conventional"
                            }`}
                          >
                            {isRenewable ? <Leaf className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                            {isRenewable ? "Renewable" : "Conventional"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
