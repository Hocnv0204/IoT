import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authService } from "../services/authService";
import { parkingSessionService } from "../services/parkingSessionService";
import { 
  Car, 
  LogIn, 
  LogOut, 
  ClipboardList, 
  Monitor, 
  CreditCard,
  Calendar,
  TrendingUp,
  Users,
  ParkingCircle,
  ChevronRight,
  RefreshCw,
  Power
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [navigate, isAuthenticated]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOverview();
  }, [isAuthenticated]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await parkingSessionService.getOverview();
      setStats(data);
    } catch (err) {
      console.error("Lỗi khi tải thống kê tổng quan:", err);
      setError("Không thể tải số liệu thống kê. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate({ to: "/login", replace: true });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white/60">Đang chuyển hướng...</div>
      </div>
    );
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const statsCards = stats ? [
    {
      title: "Tổng xe đăng ký",
      value: stats.totalVehicleRegistered,
      subtitle: "Tất cả xe trong hệ thống",
      icon: Car,
      gradient: "from-violet-500 to-purple-600",
      iconBg: "bg-violet-400/20"
    },
    {
      title: "Lượt vào hôm nay",
      value: stats.totalCheckInsToday,
      subtitle: "Từ 00:00 đến hiện tại",
      icon: LogIn,
      gradient: "from-emerald-500 to-green-600",
      iconBg: "bg-emerald-400/20"
    },
    {
      title: "Lượt ra hôm nay",
      value: stats.totalCheckOutsToday,
      subtitle: "Tổng xe đã rời bãi",
      icon: LogOut,
      gradient: "from-amber-500 to-orange-600",
      iconBg: "bg-amber-400/20"
    },
    {
      title: "Đang đỗ trong bãi",
      value: stats.currentOccupancy,
      subtitle: "Số xe hiện tại",
      icon: ParkingCircle,
      gradient: "from-blue-500 to-cyan-600",
      iconBg: "bg-blue-400/20"
    }
  ] : [];

  const quickActions = [
    {
      title: "Giám sát thời gian thực",
      description: "Theo dõi xe ra vào trực tiếp",
      icon: Monitor,
      color: "from-green-500 to-emerald-600",
      hoverColor: "hover:shadow-green-500/25",
      route: "/monitoring"
    },
    {
      title: "Đăng ký vé tháng",
      description: "Đăng ký thẻ xe cho khách hàng",
      icon: CreditCard,
      color: "from-indigo-500 to-purple-600",
      hoverColor: "hover:shadow-purple-500/25",
      route: "/register-monthly"
    },
    {
      title: "Đăng ký vé ngày",
      description: "Cấp vé lượt cho khách vãng lai",
      icon: Calendar,
      color: "from-blue-500 to-cyan-600",
      hoverColor: "hover:shadow-blue-500/25",
      route: "/register-daily"
    },
    {
      title: "Lịch sử ra vào",
      description: "Xem log giao dịch",
      icon: ClipboardList,
      color: "from-slate-600 to-slate-700",
      hoverColor: "hover:shadow-slate-500/25",
      route: "/logs"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <ParkingCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Smart Parking</h1>
                <p className="text-sm text-white/60">Hệ thống quản lý bãi đỗ xe thông minh</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right hidden md:block">
                <p className="text-sm text-white/60">{formatDate(currentTime)}</p>
                <p className="text-lg font-mono text-white">{formatTime(currentTime)}</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-red-500/80 text-white/80 hover:text-white rounded-lg transition-all duration-300 group"
              >
                <Power className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Xin chào! 👋
          </h2>
          <p className="text-white/60">
            Đây là tổng quan về bãi đỗ xe của bạn trong ngày hôm nay.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between">
            <span className="text-red-400">{error}</span>
            <button 
              onClick={fetchOverview}
              className="flex items-center gap-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {loading ? (
            // Loading skeleton
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 animate-pulse">
                <div className="h-12 w-12 bg-white/10 rounded-xl mb-4"></div>
                <div className="h-8 w-20 bg-white/10 rounded mb-2"></div>
                <div className="h-4 w-32 bg-white/10 rounded"></div>
              </div>
            ))
          ) : (
            statsCards.map((card, index) => (
              <div
                key={index}
                className="group bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl"
              >
                <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className={`w-6 h-6 text-white`} />
                </div>
                <div className={`text-4xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent mb-1`}>
                  {card.value}
                </div>
                <div className="text-white font-medium mb-1">{card.title}</div>
                <div className="text-sm text-white/50">{card.subtitle}</div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Truy cập nhanh
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate({ to: action.route })}
                className={`group relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl ${action.hoverColor} text-left`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="text-white font-semibold mb-1 flex items-center gap-2">
                  {action.title}
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <div className="text-sm text-white/50">{action.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-white/30 text-sm py-8">
          <p>Smart Parking System © 2024 - Hệ thống quản lý bãi đỗ xe thông minh</p>
        </div>
      </main>
    </div>
  );
}
