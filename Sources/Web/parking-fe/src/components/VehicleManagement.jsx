import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authService } from "../services/authService";
import { vehicleService } from "../services/vehicleService";
import { customerService } from "../services/customerService";
import {
  Car,
  Edit,
  ChevronLeft,
  ChevronRight,
  Search,
  Save,
  X,
  Loader,
  AlertCircle,
  User,
  FileText,
} from "lucide-react";

export default function VehicleManagement() {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();

  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchPlate, setSearchPlate] = useState("");

  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editFormData, setEditFormData] = useState({
    plateNumber: "",
    vehicleType: "",
    customerId: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [navigate, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchVehicles();
      fetchCustomers();
    }
  }, [isAuthenticated, currentPage, pageSize]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vehicleService.findAll(
        currentPage,
        pageSize,
        "id",
        "desc"
      );
      setVehicles(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error("Lỗi khi tải danh sách xe:", err);
      setError("Không thể tải danh sách xe. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customerService.getAllCustomers(0, 1000);
      setCustomers(data.content || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách khách hàng:", err);
    }
  };

  const handleSearch = async () => {
    if (!searchPlate.trim()) {
      fetchVehicles();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await vehicleService.search(null, searchPlate);
      setVehicles(data || []);
      setTotalPages(1);
    } catch (err) {
      console.error("Lỗi khi tìm kiếm:", err);
      setError("Không tìm thấy xe với biển số này.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (vehicle) => {
    setEditingVehicle(vehicle.id);
    setEditFormData({
      plateNumber: vehicle.licensePlate || "",
      vehicleType: vehicle.vehicleType || "",
      customerId: vehicle.customerId || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingVehicle(null);
    setEditFormData({
      plateNumber: "",
      vehicleType: "",
      customerId: "",
    });
  };

  const handleSaveEdit = async (vehicleId) => {
    try {
      setUpdateLoading(true);
      setError(null);

      await vehicleService.update(vehicleId, editFormData);

      setEditingVehicle(null);
      fetchVehicles();
    } catch (err) {
      console.error("Lỗi khi cập nhật xe:", err);
      setError("Không thể cập nhật thông tin xe. Vui lòng thử lại.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find((c) => c.customerId === customerId);
    return customer ? customer.fullName : "";
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white/60">Đang chuyển hướng...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/5 backdrop-blur-xl border-white/10">
        <div className="px-6 py-4 mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate({ to: "/dashboard" })}
                className="p-2 transition-colors rounded-lg hover:bg-white/10"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-violet-500/25">
                <Car className="text-white w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Quản lý phương tiện
                </h1>
                <p className="text-sm text-white/60">
                  Danh sách tất cả xe trong hệ thống
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 mx-auto max-w-7xl">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute w-5 h-5 transform -translate-y-1/2 left-3 top-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo biển số xe..."
                  value={searchPlate}
                  onChange={(e) => setSearchPlate(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full py-3 pl-10 pr-4 text-white border bg-white/5 border-white/10 rounded-xl placeholder-white/40 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-6 py-3 font-medium text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl shadow-violet-500/25"
            >
              <Search className="w-5 h-5" />
              Tìm kiếm
            </button>
            {searchPlate && (
              <button
                onClick={() => {
                  setSearchPlate("");
                  fetchVehicles();
                }}
                className="px-6 py-3 font-medium text-white transition-all duration-300 border bg-white/5 hover:bg-white/10 rounded-xl border-white/10"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 border bg-red-500/10 border-red-500/30 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden border bg-white/5 backdrop-blur-xl rounded-2xl border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-sm font-semibold text-left text-white/80">
                    ID
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-left text-white/80">
                    Biển số xe
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-left text-white/80">
                    Loại xe
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-left text-white/80">
                    Chủ xe
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-center text-white/80">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Loader className="w-6 h-6 text-violet-400 animate-spin" />
                        <span className="text-white/60">Đang tải...</span>
                      </div>
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Car className="w-12 h-12 text-white/20" />
                        <span className="text-white/60">
                          Không có phương tiện nào
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="transition-colors border-b border-white/5 hover:bg-white/5"
                    >
                      {editingVehicle === vehicle.id ? (
                        <>
                          <td className="px-6 py-4 text-white/60">
                            {vehicle.id}
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editFormData.plateNumber}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  plateNumber: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-white border rounded-lg bg-white/5 border-white/10 focus:outline-none focus:border-violet-500/50"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editFormData.vehicleType}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  vehicleType: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-white border rounded-lg bg-white/5 border-white/10 focus:outline-none focus:border-violet-500/50"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={editFormData.customerId}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  customerId: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 text-white border rounded-lg bg-white/5 border-white/10 focus:outline-none focus:border-violet-500/50"
                            >
                              <option value="">Chọn chủ xe</option>
                              {customers.map((customer) => (
                                <option
                                  key={customer.customerId}
                                  value={customer.customerId}
                                  className="bg-slate-800"
                                >
                                  {customer.fullName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  handleSaveEdit(vehicle.id)
                                }
                                disabled={updateLoading}
                                className="p-2 text-green-400 transition-colors rounded-lg bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50"
                              >
                                {updateLoading ? (
                                  <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={updateLoading}
                                className="p-2 text-red-400 transition-colors rounded-lg bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-white/60">
                            {vehicle.id}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-violet-400" />
                              <span className="font-medium text-white">
                                {vehicle.licensePlate}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white/80">
                              {vehicle.vehicleType || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-400" />
                              <span className="text-white/80">
                              <span className="text-white/80">
                                {vehicle.owner || "Chưa có"}
                              </span>
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleEditClick(vehicle)}
                                className="p-2 transition-colors rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 group"
                              >
                                <Edit className="w-4 h-4 transition-transform group-hover:scale-110" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && vehicles.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
              <div className="text-sm text-white/60">
                Trang {currentPage + 1} / {totalPages || 1}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-2 text-white transition-colors rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                  className="p-2 text-white transition-colors rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
