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
  Power,
  IdCard,
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white/60">Đang chuyển hướng...</div>
      </div>
    );
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const statsCards = stats
    ? [
        {
          title: "Tổng xe đăng ký",
          value: stats.totalVehicleRegistered,
          subtitle: "Tất cả xe trong hệ thống",
          icon: Car,
          gradient: "from-violet-500 to-purple-600",
          iconBg: "bg-violet-400/20",
        },
        {
          title: "Lượt vào hôm nay",
          value: stats.totalCheckInsToday,
          subtitle: "Từ 00:00 đến hiện tại",
          icon: LogIn,
          gradient: "from-emerald-500 to-green-600",
          iconBg: "bg-emerald-400/20",
        },
        {
          title: "Lượt ra hôm nay",
          value: stats.totalCheckOutsToday,
          subtitle: "Tổng xe đã rời bãi",
          icon: LogOut,
          gradient: "from-amber-500 to-orange-600",
          iconBg: "bg-amber-400/20",
        },
        {
          title: "Đang đỗ trong bãi",
          value: stats.currentOccupancy,
          subtitle: "Số xe hiện tại",
          icon: ParkingCircle,
          gradient: "from-blue-500 to-cyan-600",
          iconBg: "bg-blue-400/20",
        },
      ]
    : [];

  const quickActions = [
    {
      title: "Giám sát thời gian thực",
      description: "Theo dõi xe ra vào trực tiếp",
      icon: Monitor,
      color: "from-green-500 to-emerald-600",
      hoverColor: "hover:shadow-green-500/25",
      route: "/monitoring",
    },
    {
      title: "Quản lý thẻ",
      description: "Danh sách & đăng ký thẻ tháng/ngày",
      icon: IdCard,
      color: "from-cyan-500 to-blue-600",
      hoverColor: "hover:shadow-cyan-500/25",
      route: "/cards",
    },
    {
      title: "Quản lý khách hàng",
      description: "Danh sách khách hàng & thông tin",
      icon: Users,
      color: "from-blue-500 to-cyan-600",
      hoverColor: "hover:shadow-blue-500/25",
      route: "/customers",
    },
    {
      title: "Quản lý phương tiện",
      description: "Danh sách xe & chủ xe",
      icon: Car,
      color: "from-violet-500 to-purple-600",
      hoverColor: "hover:shadow-violet-500/25",
      route: "/vehicles",
    },
    {
      title: "Lịch sử ra vào",
      description: "Xem log giao dịch",
      icon: ClipboardList,
      color: "from-slate-600 to-slate-700",
      hoverColor: "hover:shadow-slate-500/25",
      route: "/logs",
    },
    {
      title: "Thống kê doanh thu",
      description: "Báo cáo doanh thu vé lượt",
      icon: TrendingUp,
      color: "from-yellow-500 to-orange-600",
      hoverColor: "hover:shadow-yellow-500/25",
      route: "/statistics",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/5 backdrop-blur-xl border-white/10">
        <div className="px-6 py-4 mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-blue-500/25">
                <ParkingCircle className="text-white w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Smart Parking</h1>
                <p className="text-sm text-white/60">
                  Hệ thống quản lý bãi đỗ xe thông minh
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden text-right md:block">
                <p className="text-sm text-white/60">
                  {formatDate(currentTime)}
                </p>
                <p className="font-mono text-lg text-white">
                  {formatTime(currentTime)}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 transition-all duration-300 rounded-lg bg-white/10 hover:bg-red-500/80 text-white/80 hover:text-white group"
              >
                <Power className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 mx-auto max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold text-white">Xin chào! 👋</h2>
          <p className="text-white/60">
            Đây là tổng quan về bãi đỗ xe của bạn trong ngày hôm nay.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-between p-4 mb-6 border bg-red-500/10 border-red-500/30 rounded-xl">
            <span className="text-red-400">{error}</span>
            <button
              onClick={fetchOverview}
              className="flex items-center gap-2 px-3 py-1 text-red-400 transition-colors rounded-lg bg-red-500/20 hover:bg-red-500/30"
            >
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 mb-10 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? // Loading skeleton
              [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="p-6 border bg-white/5 backdrop-blur-xl rounded-2xl border-white/10 animate-pulse"
                >
                  <div className="w-12 h-12 mb-4 bg-white/10 rounded-xl"></div>
                  <div className="w-20 h-8 mb-2 rounded bg-white/10"></div>
                  <div className="w-32 h-4 rounded bg-white/10"></div>
                </div>
              ))
            : statsCards.map((card, index) => (
                <div
                  key={index}
                  className="p-6 transition-all duration-300 border group bg-white/5 backdrop-blur-xl rounded-2xl border-white/10 hover:border-white/20 hover:transform hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <card.icon className={`w-6 h-6 text-white`} />
                  </div>
                  <div
                    className={`text-4xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent mb-1`}
                  >
                    {card.value}
                  </div>
                  <div className="mb-1 font-medium text-white">
                    {card.title}
                  </div>
                  <div className="text-sm text-white/50">{card.subtitle}</div>
                </div>
              ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="flex items-center gap-2 mb-4 text-xl font-bold text-white">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Truy cập nhanh
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate({ to: action.route })}
                className={`group relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl ${action.hoverColor} text-left`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                ></div>

                <div
                  className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <action.icon className="w-6 h-6 text-white" />
                </div>

                <div className="flex items-center gap-2 mb-1 font-semibold text-white">
                  {action.title}
                  <ChevronRight className="w-4 h-4 transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1" />
                </div>
                <div className="text-sm text-white/50">
                  {action.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="py-8 text-sm text-center text-white/30">
          <p>
            Smart Parking System © 2024 - Hệ thống quản lý bãi đỗ xe thông minh
          </p>
        </div>
      </main>
    </div>
  );
}
