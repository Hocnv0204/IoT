import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authService } from "../services/authService";
import { customerService } from "../services/customerService";
import {
  Users,
  Edit,
  ChevronLeft,
  ChevronRight,
  Search,
  Save,
  X,
  Loader,
  AlertCircle,
  Phone,
  CreditCard,
  User,
} from "lucide-react";

export default function CustomerManagement() {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    phoneNumber: "",
    identityCard: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [navigate, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
    }
  }, [isAuthenticated]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all customers initially (backend supports findAll logic via search or dedicated endpoint)
      const data = await customerService.findAll();
      setCustomers(data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách khách hàng:", err);
      setError("Không thể tải danh sách khách hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchCustomers();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await customerService.search(searchQuery);
      setCustomers(data || []);
    } catch (err) {
      console.error("Lỗi khi tìm kiếm:", err);
      setError("Không tìm thấy khách hàng.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (customer) => {
    setEditingCustomer(customer.id);
    setEditFormData({
      fullName: customer.fullName || "",
      phoneNumber: customer.phoneNumber || "",
      identityCard: customer.identityCard || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
    setEditFormData({
      fullName: "",
      phoneNumber: "",
      identityCard: "",
    });
  };

  const handleSaveEdit = async (customerId) => {
    try {
      setUpdateLoading(true);
      setError(null);

      await customerService.update(customerId, editFormData);

      setEditingCustomer(null);
      // Refresh list to show updates (and potentially re-fetch if search was active, but simple refresh is safer)
      if (searchQuery.trim()) {
          handleSearch();
      } else {
          fetchCustomers();
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật khách hàng:", err);
      setError("Không thể cập nhật thông tin khách hàng. Vui lòng thử lại.");
    } finally {
      setUpdateLoading(false);
    }
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
              <div className="flex items-center justify-center w-12 h-12 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-blue-500/25">
                <Users className="text-white w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Quản lý khách hàng
                </h1>
                <p className="text-sm text-white/60">
                  Danh sách khách hàng trong hệ thống
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
                  placeholder="Tìm kiếm theo Tên, SĐT, CCCD..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full py-3 pl-10 pr-4 text-white border bg-white/5 border-white/10 rounded-xl placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-6 py-3 font-medium text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 rounded-xl shadow-blue-500/25"
            >
              <Search className="w-5 h-5" />
              Tìm kiếm
            </button>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  fetchCustomers();
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
                    Họ và tên
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-left text-white/80">
                    Số điện thoại
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-left text-white/80">
                    CCCD / CMT
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
                        <Loader className="w-6 h-6 text-blue-400 animate-spin" />
                        <span className="text-white/60">Đang tải...</span>
                      </div>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-12 h-12 text-white/20" />
                        <span className="text-white/60">
                          Không có khách hàng nào
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition-colors border-b border-white/5 hover:bg-white/5"
                    >
                      {editingCustomer === customer.id ? (
                        <>
                          <td className="px-6 py-4 text-white/60">
                            {customer.id}
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editFormData.fullName}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  fullName: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-white border rounded-lg bg-white/5 border-white/10 focus:outline-none focus:border-blue-500/50"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editFormData.phoneNumber}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  phoneNumber: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-white border rounded-lg bg-white/5 border-white/10 focus:outline-none focus:border-blue-500/50"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editFormData.identityCard}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  identityCard: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-white border rounded-lg bg-white/5 border-white/10 focus:outline-none focus:border-blue-500/50"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(customer.id)}
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
                            {customer.id}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-400" />
                              <span className="font-medium text-white">
                                {customer.fullName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-white/40" />
                              <span className="text-white/80">
                                {customer.phoneNumber || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-white/40" />
                              <span className="text-white/80">
                                {customer.identityCard || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleEditClick(customer)}
                                className="p-2 transition-colors rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 group"
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
        </div>
      </main>
    </div>
  );
}
