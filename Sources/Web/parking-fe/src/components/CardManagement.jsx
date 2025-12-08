import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ConfigProvider, Table, Tag, Modal, Select, message, theme } from "antd";
import { CreditCard, Home, RefreshCw, Edit3, ShieldAlert, Plus, Wifi, WifiOff, User, Car, Calendar, Search, CheckCircle, XCircle, AlertTriangle, Radio } from "lucide-react";
import { authService } from "../services/authService";
import { cardService } from "../services/cardService";
import { customerService } from "../services/customerService";
import { vehicleService } from "../services/vehicleService";
import { parkingSessionService } from "../services/parkingSessionService";
import { websocketService } from "../services/websocketService";

const statusMeta = {
  ACTIVE: { label: "Đang dùng", color: "green" },
  LOCKED: { label: "Bị khóa", color: "red" },
  LOST: { label: "Báo mất", color: "orange" },
};

// Small Modal Component
function SmallModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <XCircle size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function CardManagement() {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();

  // Card list state
  const [cards, setCards] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  // Edit card state
  const [editingCard, setEditingCard] = useState(null);
  const [newStatus, setNewStatus] = useState("ACTIVE");
  const [updating, setUpdating] = useState(false);

  // Monthly registration state
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [esp32Ip, setEsp32Ip] = useState('192.168.2.16');
  const [esp32Connected, setEsp32Connected] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [plateQuery, setPlateQuery] = useState("");
  const [vehicleSuggestions, setVehicleSuggestions] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [uid, setUid] = useState("");
  const [months, setMonths] = useState(1);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showNewVehicleModal, setShowNewVehicleModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ fullName: "", phoneNumber: "", identityCard: "" });
  const [newVehicle, setNewVehicle] = useState({ licensePlate: "", type: "CAR", brand: "", color: "" });

  // Daily registration state
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [scannedCardId, setScannedCardId] = useState('');
  const [dailyLoading, setDailyLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [navigate, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchCards();
  }, [isAuthenticated, pageNumber, pageSize, statusFilter]);

  useEffect(() => {
    return () => {
      websocketService.disconnectEsp32();
    };
  }, []);

  // Customer search
  useEffect(() => {
    const t = setTimeout(() => {
      if (!query || query.trim() === "") {
        setSuggestions([]);
        return;
      }
      customerService
        .search(query)
        .then((list) => setSuggestions(list || []))
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Vehicle search
  useEffect(() => {
    const t = setTimeout(() => {
      if (!selectedCustomer) {
        setVehicleSuggestions([]);
        return;
      }
      vehicleService
        .search(selectedCustomer.id, plateQuery)
        .then((list) => setVehicleSuggestions(list || []))
        .catch(() => setVehicleSuggestions([]));
    }, 250);
    return () => clearTimeout(t);
  }, [plateQuery, selectedCustomer]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const params = {
        type: "MONTHLY",
        page: pageNumber - 1,
        size: pageSize,
        sortBy: "expiredAt",
        orderBy: "DESC",
      };
      
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      const data = await cardService.list(params);
      setCards(data?.content || []);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      console.error("Lỗi tải danh sách thẻ:", err);
      message.error("Không thể tải danh sách thẻ");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openEditModal = (card) => {
    setEditingCard(card);
    setNewStatus(card?.status || "ACTIVE");
  };

  const handleUpdateStatus = async () => {
    if (!editingCard) return;
    try {
      setUpdating(true);
      const updated = await cardService.updateStatus(editingCard.id, newStatus);
      message.success("Cập nhật trạng thái thẻ thành công");
      setEditingCard(null);
      fetchCards();
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      const msg = err.response?.data?.message || "Cập nhật trạng thái thất bại";
      message.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleConnectEsp32 = () => {
    if (esp32Connected) {
      websocketService.disconnectEsp32();
      setEsp32Connected(false);
      return;
    }

    websocketService.connectToEsp32(
      esp32Ip,
      () => {
        message.success("Đã kết nối với thiết bị ESP32");
        setEsp32Connected(true);
      },
      (data) => {
        if (data?.type === "RFID_SCANNED" && data?.rfid) {
          if (showMonthlyModal) setUid(data.rfid);
          if (showDailyModal) setScannedCardId(data.rfid);
          message.info(`Đã quét thẻ: ${data.rfid}`);
          return;
        }

        try {
          const json = JSON.parse(data);
          if (json.rfid || json.cardId) {
            const rfid = json.rfid || json.cardId;
            if (showMonthlyModal) setUid(rfid);
            if (showDailyModal) setScannedCardId(rfid);
            message.info(`Đã quét thẻ: ${rfid}`);
            return;
          }
        } catch (e) {
          if (typeof data === "string" && data.trim().length >= 8) {
            if (showMonthlyModal) setUid(data.trim());
            if (showDailyModal) setScannedCardId(data.trim());
            message.info(`Đã quét thẻ: ${data}`);
          }
        }
      },
      () => {
        message.warning("Đã ngắt kết nối ESP32");
        setEsp32Connected(false);
      }
    );
  };

  const createCustomer = async () => {
    if (!newCustomer.fullName) return;
    try {
      const created = await customerService.create(newCustomer);
      setSelectedCustomer(created);
      setShowNewCustomerModal(false);
      setQuery("");
      setSuggestions([]);
      message.success("Thêm khách hàng thành công");
    } catch (e) {
      console.error(e);
      message.error("Lỗi tạo khách hàng");
    }
  };

  const createVehicle = async () => {
    if (!newVehicle.licensePlate || !selectedCustomer) return;
    try {
      const payload = { 
        ...newVehicle, 
        vehicleType: newVehicle.type,
        customerId: selectedCustomer.id 
      };
      const created = await vehicleService.create(payload);
      setSelectedVehicle(created);
      setShowNewVehicleModal(false);
      setPlateQuery("");
      setVehicleSuggestions([]);
      message.success("Thêm xe thành công");
    } catch (e) {
      console.error(e);
      message.error("Lỗi tạo xe");
    }
  };

  const assignCard = async () => {
    if (!selectedVehicle) return message.warning("Chưa chọn xe");
    if (!uid) return message.warning("Vui lòng nhập mã UID");
    
    try {
      await cardService.assign({
        vehicleId: selectedVehicle.id,
        cardCode: uid,
        monthsDuration: Number(months),
      });
      
      message.success("Đăng ký thẻ tháng thành công");
      
      // Reset form
      setSelectedCustomer(null);
      setSelectedVehicle(null);
      setUid("");
      setMonths(1);
      setShowMonthlyModal(false);
      
      // Refresh card list
      fetchCards();
    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data?.message || "Lỗi khi đăng ký thẻ";
      message.error(errorMsg);
    }
  };

  const handleRegisterDaily = async () => {
    if (!scannedCardId) {
      message.error("Vui lòng quét thẻ trước khi đăng ký");
      return;
    }

    try {
      setDailyLoading(true);
      await cardService.registerDaily(scannedCardId);
      message.success("Đăng ký vé ngày thành công!");
      setScannedCardId('');
      setShowDailyModal(false);
      fetchCards();
    } catch (error) {
      console.error("Registration error:", error);
      let errorMsg = error.response?.data?.message || error.message || "Đăng ký thất bại. Vui lòng thử lại.";
      
      if (errorMsg && errorMsg.toLowerCase().includes("card already exists")) {
        errorMsg = "Thẻ này đã tồn tại trong hệ thống";
      }

      message.error(errorMsg);
    } finally {
      setDailyLoading(false);
    }
  };

  const expiryDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + Number(months));
    return d.toLocaleDateString('vi-VN');
  }, [months]);

  const columns = useMemo(
    () => [
      {
        title: "Mã thẻ",
        dataIndex: "code",
        key: "code",
        render: (code) => (
          <span className="px-3 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono text-sm">
            {code}
          </span>
        ),
      },
      {
        title: "Chủ phương tiện",
        dataIndex: "ownerName",
        key: "ownerName",
        render: (name) => <span className="text-white/80">{name || "Chưa cập nhật"}</span>,
      },
      {
        title: "Biển số",
        dataIndex: "licensePlate",
        key: "licensePlate",
        render: (plate) => (
          <span className="px-3 py-1 rounded-lg bg-amber-400/20 text-amber-200 border border-amber-400/40 font-semibold">
            {plate || "-"}
          </span>
        ),
      },
      {
        title: "Bắt đầu",
        dataIndex: "issuedAt",
        key: "issuedAt",
        render: (value) => (
          <span className="text-white/70">
            {value ? new Date(value).toLocaleString("vi-VN") : "-"}
          </span>
        ),
      },
      {
        title: "Hết hạn",
        dataIndex: "expiredAt",
        key: "expiredAt",
        render: (value) => (
          <span className="text-white/70">
            {value ? new Date(value).toLocaleString("vi-VN") : "-"}
          </span>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const meta = statusMeta[status] || { label: status, color: "default" };
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "Thao tác",
        key: "action",
        render: (_, record) => (
          <button
            onClick={() => openEditModal(record)}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white/80 hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Chỉnh sửa
          </button>
        ),
      },
    ],
    []
  );

  const getStatusLabel = () => {
    if (statusFilter === "ALL") return "tất cả trạng thái";
    return statusMeta[statusFilter]?.label.toLowerCase() || statusFilter;
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgContainer: 'rgba(255, 255, 255, 0.04)',
          colorBorder: 'rgba(255, 255, 255, 0.12)',
          colorText: 'rgba(255, 255, 255, 0.9)',
        },
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Quản lý thẻ</h1>
                  <p className="text-sm text-white/60">Hiển thị thẻ MONTHLY - {getStatusLabel()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate({ to: "/register-monthly" })}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-purple-500/25"
                >
                  <Plus className="w-4 h-4" />
                  Đăng ký vé tháng
                </button>
                <button
                  onClick={() => navigate({ to: "/register-daily" })}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-500/25"
                >
                  <Plus className="w-4 h-4" />
                  Đăng ký vé ngày
                </button>
                <button
                  onClick={() => {
                    setRefreshing(true);
                    fetchCards();
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg border border-white/10 flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  Làm mới
                </button>
                <button
                  onClick={() => navigate({ to: "/dashboard" })}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg border border-white/10 flex items-center gap-2 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Trang chủ
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Danh sách thẻ tháng</h3>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/60">Lọc theo trạng thái:</span>
                <Select
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                    setPageNumber(1);
                  }}
                  className="w-40"
                  options={[
                    { value: "ALL", label: "Tất cả" },
                    ...Object.entries(statusMeta).map(([value, meta]) => ({
                      value,
                      label: meta.label,
                    }))
                  ]}
                />
              </div>
            </div>

            <Table
              columns={columns}
              dataSource={cards}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pageNumber,
                pageSize,
                total: totalElements,
                onChange: (page, size) => {
                  setPageNumber(page);
                  setPageSize(size);
                },
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} thẻ`,
              }}
              className="card-table"
            />
          </div>
        </main>

        {/* Edit Status Modal */}
        <Modal
          open={!!editingCard}
          centered
          title={<span className="text-white">Cập nhật trạng thái thẻ</span>}
          okText="Lưu"
          cancelText="Hủy"
          okButtonProps={{ loading: updating }}
          onOk={handleUpdateStatus}
          onCancel={() => setEditingCard(null)}
          className="dark-modal"
        >
          <div className="space-y-3">
            <div>
              <div className="text-sm text-white/60 mb-1">Mã thẻ</div>
              <div className="px-3 py-2 bg-white/5 rounded-lg text-white font-mono">
                {editingCard?.code}
              </div>
            </div>
            <div>
              <div className="text-sm text-white/60 mb-1">Chọn trạng thái</div>
              <Select
                value={newStatus}
                onChange={setNewStatus}
                className="w-full"
                options={Object.entries(statusMeta).map(([value, meta]) => ({
                  value,
                  label: meta.label,
                }))}
              />
            </div>
          </div>
        </Modal>

        {/* Monthly Registration Modal */}
        <Modal
          open={showMonthlyModal}
          onCancel={() => {
            setShowMonthlyModal(false);
            setSelectedCustomer(null);
            setSelectedVehicle(null);
            setUid("");
            setMonths(1);
          }}
          footer={null}
          width={700}
          centered
          className="dark-modal"
        >
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Đăng ký vé tháng</h2>
            
            {/* ESP32 Connection */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${esp32Connected ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
                    <Wifi className={`w-5 h-5 ${esp32Connected ? 'text-emerald-400' : 'text-white/40'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">Thiết bị đọc thẻ (ESP32)</h3>
                    <p className="text-xs text-white/50">{esp32Connected ? 'Đã kết nối' : 'Chưa kết nối'}</p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${esp32Connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
              </div>

              <div className="flex gap-2">
                <input 
                  value={esp32Ip}
                  onChange={(e) => setEsp32Ip(e.target.value)}
                  placeholder="IP ESP32"
                  disabled={esp32Connected}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 outline-none disabled:opacity-50"
                />
                <button 
                  onClick={handleConnectEsp32}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                    esp32Connected 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  }`}
                >
                  {esp32Connected ? <WifiOff size={16}/> : <Wifi size={16}/>}
                  {esp32Connected ? "Ngắt" : "Kết nối"}
                </button>
              </div>

              <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-purple-300">Chuyển hệ thống sang chế độ ĐĂNG KÝ</span>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await parkingSessionService.setStatus("REGISTER");
                        message.success(res.message || "Đã chuyển sang chế độ ĐĂNG KÝ");
                      } catch (e) {
                        message.error(e.response?.data?.message || "Lỗi khi chuyển chế độ");
                      }
                    }}
                    className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-xs font-medium transition-colors"
                  >
                    Bật chế độ
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Selection */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-white text-sm">Xác định chủ xe</h3>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm theo tên hoặc SĐT"
                    className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 outline-none"
                  />
                </div>
                <button
                  onClick={() => setShowNewCustomerModal(true)}
                  className="px-3 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg flex items-center gap-1 text-sm transition-colors"
                >
                  <Plus size={16} />
                  Thêm mới
                </button>
              </div>

              {suggestions.length > 0 && (
                <ul className="mt-2 border border-white/10 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                  {suggestions.map((c) => (
                    <li
                      key={c.id}
                      className="px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                      onClick={() => { setSelectedCustomer(c); setSuggestions([]); setQuery(""); }}
                    >
                      <div className="font-medium text-white text-sm">{c.fullName}</div>
                      <div className="text-xs text-white/50">{c.phoneNumber}</div>
                    </li>
                  ))}
                </ul>
              )}

              {selectedCustomer && (
                <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white text-sm">{selectedCustomer.fullName}</div>
                    <div className="text-xs text-white/60">{selectedCustomer.phoneNumber}</div>
                  </div>
                  <button className="text-xs text-red-400 hover:text-red-300" onClick={() => setSelectedCustomer(null)}>
                    Bỏ chọn
                  </button>
                </div>
              )}
            </div>

            {/* Vehicle Selection */}
            <div className={`bg-white/5 rounded-xl p-4 border border-white/10 ${!selectedCustomer ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2 mb-3">
                <Car className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-white text-sm">Xác định xe đăng ký</h3>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    value={plateQuery}
                    onChange={(e) => setPlateQuery(e.target.value)}
                    placeholder="Tìm biển số"
                    disabled={!selectedCustomer}
                    className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 outline-none disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={() => setShowNewVehicleModal(true)}
                  disabled={!selectedCustomer}
                  className="px-3 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg flex items-center gap-1 text-sm transition-colors disabled:opacity-50"
                >
                  <Plus size={16} />
                  Thêm xe
                </button>
              </div>

              {vehicleSuggestions.length > 0 && (
                <ul className="mt-2 border border-white/10 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                  {vehicleSuggestions.map((v) => (
                    <li
                      key={v.id}
                      className="px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                      onClick={() => { setSelectedVehicle(v); setVehicleSuggestions([]); setPlateQuery(""); }}
                    >
                      <div className="font-medium text-white text-sm">{v.licensePlate}</div>
                      <div className="text-xs text-white/50">{v.type} • {v.brand} • {v.color}</div>
                    </li>
                  ))}
                </ul>
              )}

              {selectedVehicle && (
                <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white text-sm">{selectedVehicle.licensePlate}</div>
                    <div className="text-xs text-white/60">{selectedVehicle.type} • {selectedVehicle.brand}</div>
                  </div>
                  <button className="text-xs text-red-400 hover:text-red-300" onClick={() => setSelectedVehicle(null)}>
                    Bỏ chọn
                  </button>
                </div>
              )}
            </div>

            {/* Card UID */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-white text-sm">Nhập thông tin thẻ</h3>
              </div>
              <input
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="Nhập mã UID trên thẻ"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 outline-none"
              />
            </div>

            {/* Package */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-white text-sm">Thiết lập gói dịch vụ</h3>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm outline-none cursor-pointer"
                  style={{ backgroundColor: '#1e293b' }}
                >
                  <option value={1}>1 Tháng</option>
                  <option value={3}>3 Tháng</option>
                  <option value={6}>6 Tháng</option>
                  <option value={12}>1 Năm</option>
                </select>
                <div className="text-white/60 text-sm">
                  Ngày hết hạn: <span className="font-medium text-white">{expiryDate}</span>
                </div>
              </div>
            </div>

            <button
              onClick={assignCard}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Đăng ký vé tháng
            </button>
          </div>
        </Modal>

        {/* Daily Registration Modal */}
        <Modal
          open={showDailyModal}
          onCancel={() => {
            setShowDailyModal(false);
            setScannedCardId('');
          }}
          footer={null}
          width={600}
          centered
          className="dark-modal"
        >
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Đăng ký vé ngày</h2>
            
            {/* ESP32 Connection */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${esp32Connected ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
                    <Wifi className={`w-5 h-5 ${esp32Connected ? 'text-emerald-400' : 'text-white/40'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">Thiết bị đọc thẻ (ESP32)</h3>
                    <p className="text-xs text-white/50">{esp32Connected ? 'Đã kết nối' : 'Chưa kết nối'}</p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${esp32Connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
              </div>

              <div className="flex gap-2">
                <input 
                  value={esp32Ip}
                  onChange={(e) => setEsp32Ip(e.target.value)}
                  placeholder="IP ESP32"
                  disabled={esp32Connected}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 outline-none disabled:opacity-50"
                />
                <button 
                  onClick={handleConnectEsp32}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                    esp32Connected 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  }`}
                >
                  {esp32Connected ? <WifiOff size={16}/> : <Wifi size={16}/>}
                  {esp32Connected ? "Ngắt" : "Kết nối"}
                </button>
              </div>

              <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-purple-300">Chuyển hệ thống sang chế độ ĐĂNG KÝ</span>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await parkingSessionService.setStatus("REGISTER");
                        message.success(res.message || "Đã chuyển sang chế độ ĐĂNG KÝ");
                      } catch (e) {
                        message.error(e.response?.data?.message || "Lỗi khi chuyển chế độ");
                      }
                    }}
                    className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-xs font-medium transition-colors"
                  >
                    Bật chế độ
                  </button>
                </div>
              </div>
            </div>

            {/* Card Scanner */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="mb-3">
                <h3 className="font-semibold text-white text-sm mb-1">Mã thẻ đã quét</h3>
                <p className="text-xs text-white/50">Đưa thẻ vào đầu đọc sau khi đã kết nối thiết bị</p>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg mb-4">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <input 
                  value={scannedCardId}
                  placeholder="Chờ quét thẻ..."
                  readOnly
                  className="flex-1 bg-transparent text-lg font-mono text-white placeholder-white/30 outline-none"
                />
              </div>

              <button 
                onClick={handleRegisterDaily}
                disabled={!scannedCardId || dailyLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {dailyLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    <span>Đăng ký vé ngày</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>

        {/* New Customer Modal */}
        <SmallModal open={showNewCustomerModal} onClose={() => setShowNewCustomerModal(false)} title="Thêm khách hàng mới">
          <div className="space-y-3">
            <input
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 outline-none"
              placeholder="Họ tên"
              value={newCustomer.fullName}
              onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })}
            />
            <input
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 outline-none"
              placeholder="Số điện thoại"
              value={newCustomer.phoneNumber}
              onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })}
            />
            <input
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 outline-none"
              placeholder="CCCD"
              value={newCustomer.identityCard}
              onChange={(e) => setNewCustomer({ ...newCustomer, identityCard: e.target.value })}
            />
            <button
              onClick={createCustomer}
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg font-medium transition-colors"
            >
              Lưu và chọn
            </button>
          </div>
        </SmallModal>

        {/* New Vehicle Modal */}
        <SmallModal open={showNewVehicleModal} onClose={() => setShowNewVehicleModal(false)} title="Thêm xe mới">
          <div className="space-y-3">
            <input
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 outline-none"
              placeholder="Biển số"
              value={newVehicle.licensePlate}
              onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
            />
            <select
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none"
              value={newVehicle.type}
              onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
            >
              <option value="CAR">Ô tô</option>
              <option value="MOTORBIKE">Xe máy</option>
            </select>
            <input
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 outline-none"
              placeholder="Hãng xe"
              value={newVehicle.brand}
              onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
            />
            <input
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 outline-none"
              placeholder="Màu sắc"
              value={newVehicle.color}
              onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
            />
            <button
              onClick={createVehicle}
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg font-medium transition-colors"
            >
              Lưu và chọn
            </button>
          </div>
        </SmallModal>
      </div>
    </ConfigProvider>
  );
}

