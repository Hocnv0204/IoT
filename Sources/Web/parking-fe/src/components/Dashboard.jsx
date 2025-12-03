import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authService } from "../services/authService";
import { parkingSessionService } from "../services/parkingSessionService";

export default function Dashboard() {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [navigate, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

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

    fetchOverview();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Đang chuyển hướng...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Báo cáo tổng quan bãi đỗ xe
        </h1>
        <p className="text-gray-600 mb-6">
          Thống kê nhanh tình trạng bãi đỗ xe trong ngày hôm nay.
        </p>

        {loading && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="text-gray-500">Đang tải số liệu thống kê...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {stats && !loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-indigo-500">
              <div className="text-sm text-gray-500 mb-1">
                Tổng số xe đã đăng ký
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalVehicleRegistered}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Bao gồm tất cả xe có trong hệ thống
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
              <div className="text-sm text-gray-500 mb-1">
                Lượt vào hôm nay
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalCheckInsToday}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Số lượt xe đã vào bãi từ 00:00 tới hiện tại
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-amber-500">
              <div className="text-sm text-gray-500 mb-1">
                Lượt ra hôm nay
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalCheckOutsToday}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Số lượt xe đã rời bãi trong ngày
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
              <div className="text-sm text-gray-500 mb-1">
                Số xe đang đỗ hiện tại
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.currentOccupancy}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Tổng số xe vẫn còn trong bãi
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-4">
            Chào mừng bạn đến với hệ thống quản lý bãi đỗ xe!
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate({ to: "/register-monthly" })}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Đăng ký vé tháng
            </button>
            <button
              onClick={() => navigate({ to: "/logs" })}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded hover:bg-gray-50"
            >
              Xem lịch sử ra vào
            </button>
            <button
              onClick={() => navigate({ to: "/monitoring" })}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Giám sát
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
