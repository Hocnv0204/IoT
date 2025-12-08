import { useEffect, useMemo, useState } from "react";
import { message, ConfigProvider, theme } from "antd";
import { CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff, Home, User, Car, CreditCard, Calendar, Search, Plus, Radio } from 'lucide-react';
import { customerService } from "../services/customerService";
import { vehicleService } from "../services/vehicleService";
import { cardService } from "../services/cardService";
import { parkingSessionService } from "../services/parkingSessionService";
import { websocketService } from "../services/websocketService";
import { useNavigate } from "@tanstack/react-router";

function SmallModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6">
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

export default function RegisterMonthly() {
  const navigate = useNavigate();
  
  // ESP32 State
  const [esp32Ip, setEsp32Ip] = useState('192.168.2.16');
  const [esp32Connected, setEsp32Connected] = useState(false);

  // Step 1 - customer
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  // new customer form
  const [newCustomer, setNewCustomer] = useState({
    fullName: "",
    phoneNumber: "",
    identityCard: "",
  });

  // Step 2 - vehicle
  const [plateQuery, setPlateQuery] = useState("");
  const [vehicleSuggestions, setVehicleSuggestions] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showNewVehicleModal, setShowNewVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    licensePlate: "",
    type: "CAR",
    brand: "",
    color: "",
  });

  // Step 3 - card UID
  const [uid, setUid] = useState("");

  // Step 4 - package
  const [months, setMonths] = useState(1);

  const [result, setResult] = useState(null);

  const expiryDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + Number(months));
    return d.toLocaleDateString('vi-VN');
  }, [months]);

  // debounced customer search
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

  // search vehicles filtered by selected customer
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

  // create customer
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

  // create vehicle
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
    
    setResult(null);
    try {
      await cardService.assign({
        vehicleId: selectedVehicle.id,
        cardCode: uid,
        monthsDuration: Number(months),
      });
      
      const msg = "Đăng ký thẻ tháng thành công";
      message.success(msg);
      setResult({ type: 'success', title: 'Đăng ký thành công', message: msg });

      // Reset
      setSelectedCustomer(null);
      setSelectedVehicle(null);
      setUid("");
      setMonths(1);
    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data?.message || "Lỗi khi đăng ký thẻ";
      message.error(errorMsg);
      setResult({ type: 'error', title: 'Đăng ký thất bại', message: errorMsg });
    }
  };

  // ESP32 Connection Logic
  useEffect(() => {
    return () => {
      websocketService.disconnectEsp32();
    };
  }, []);

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
          setUid(data.rfid);
          message.info(`Đã quét thẻ: ${data.rfid}`);
          return;
        }

        try {
          const json = JSON.parse(data);
          if (json.rfid || json.cardId) {
            const rfid = json.rfid || json.cardId;
            setUid(rfid);
            message.info(`Đã quét thẻ: ${rfid}`);
            return;
          }
        } catch (e) {
          if (typeof data === "string" && data.trim().length >= 8) {
            setUid(data.trim());
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

  const StepCard = ({ number, title, icon: Icon, children, disabled }) => (
    <div className={`bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          {number}
        </div>
        <Icon className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgContainer: 'rgba(255, 255, 255, 0.05)',
          colorBorder: 'rgba(255, 255, 255, 0.1)',
          colorText: 'rgba(255, 255, 255, 0.85)',
        },
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Đăng ký vé tháng</h1>
                  <p className="text-sm text-white/60">Đăng ký thẻ xe cho khách hàng</p>
                </div>
              </div>
              
              <button
                onClick={() => navigate({ to: '/dashboard' })}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg transition-all duration-300"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Trang chủ</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {/* Result Notification */}
          {result && (
            <div className={`p-4 rounded-xl border flex items-start gap-4 ${
              result.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <div className={`p-2 rounded-full ${result.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                {result.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1">{result.title}</h4>
                <p className="opacity-90">{result.message}</p>
              </div>
              <button onClick={() => setResult(null)} className="p-1 rounded hover:bg-white/10 transition-colors">
                <XCircle size={20} />
              </button>
            </div>
          )}

          {/* ESP32 Connection */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${esp32Connected ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
                  <Wifi className={`w-5 h-5 ${esp32Connected ? 'text-emerald-400' : 'text-white/40'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Thiết bị đọc thẻ (ESP32)</h3>
                  <p className="text-sm text-white/50">{esp32Connected ? 'Đã kết nối' : 'Chưa kết nối'}</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${esp32Connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
            </div>

            <div className="flex gap-3">
              <input 
                value={esp32Ip}
                onChange={(e) => setEsp32Ip(e.target.value)}
                placeholder="IP ESP32"
                disabled={esp32Connected}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 outline-none disabled:opacity-50"
              />
              <button 
                onClick={handleConnectEsp32}
                className={`px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-all ${
                  esp32Connected 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                }`}
              >
                {esp32Connected ? <WifiOff size={18}/> : <Wifi size={18}/>}
                {esp32Connected ? "Ngắt" : "Kết nối"}
              </button>
            </div>
          </div>

          {/* Step 1: Customer */}
          <StepCard number="1" title="Xác định chủ xe" icon={User}>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm theo tên hoặc SĐT"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 outline-none"
                />
              </div>
              <button
                onClick={() => setShowNewCustomerModal(true)}
                className="px-4 py-3 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl flex items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                Thêm mới
              </button>
            </div>

            {suggestions.length > 0 && (
              <ul className="mt-3 border border-white/10 rounded-xl overflow-hidden">
                {suggestions.map((c) => (
                  <li
                    key={c.id}
                    className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                    onClick={() => { setSelectedCustomer(c); setSuggestions([]); setQuery(""); }}
                  >
                    <div className="font-medium text-white">{c.fullName}</div>
                    <div className="text-sm text-white/50">{c.phoneNumber}</div>
                  </li>
                ))}
              </ul>
            )}

            {selectedCustomer && (
              <div className="mt-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{selectedCustomer.fullName}</div>
                  <div className="text-sm text-white/60">{selectedCustomer.phoneNumber}</div>
                </div>
                <button className="text-sm text-red-400 hover:text-red-300" onClick={() => setSelectedCustomer(null)}>
                  Bỏ chọn
                </button>
              </div>
            )}
          </StepCard>

          {/* Step 2: Vehicle */}
          <StepCard number="2" title="Xác định xe đăng ký" icon={Car} disabled={!selectedCustomer}>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  value={plateQuery}
                  onChange={(e) => setPlateQuery(e.target.value)}
                  placeholder="Tìm biển số"
                  disabled={!selectedCustomer}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 outline-none disabled:opacity-50"
                />
              </div>
              <button
                onClick={() => setShowNewVehicleModal(true)}
                disabled={!selectedCustomer}
                className="px-4 py-3 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Plus size={18} />
                Thêm xe
              </button>
            </div>

            {vehicleSuggestions.length > 0 && (
              <ul className="mt-3 border border-white/10 rounded-xl overflow-hidden">
                {vehicleSuggestions.map((v) => (
                  <li
                    key={v.id}
                    className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                    onClick={() => { setSelectedVehicle(v); setVehicleSuggestions([]); setPlateQuery(""); }}
                  >
                    <div className="font-medium text-white">{v.licensePlate}</div>
                    <div className="text-sm text-white/50">{v.type} • {v.brand} • {v.color}</div>
                  </li>
                ))}
              </ul>
            )}

            {selectedVehicle && (
              <div className="mt-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{selectedVehicle.licensePlate}</div>
                  <div className="text-sm text-white/60">{selectedVehicle.type} • {selectedVehicle.brand}</div>
                </div>
                <button className="text-sm text-red-400 hover:text-red-300" onClick={() => setSelectedVehicle(null)}>
                  Bỏ chọn
                </button>
              </div>
            )}
          </StepCard>

          {/* Step 3: Card UID */}
          <StepCard number="3" title="Nhập thông tin thẻ" icon={CreditCard}>
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Radio className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-purple-300">Chuyển hệ thống sang chế độ ĐĂNG KÝ</span>
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
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition-colors"
                >
                  Bật chế độ Đăng ký
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
              <CreditCard className="w-6 h-6 text-blue-400" />
              <input
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="Nhập mã UID trên thẻ"
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none"
              />
            </div>
          </StepCard>

          {/* Step 4: Package */}
          <StepCard number="4" title="Thiết lập gói dịch vụ" icon={Calendar}>
            <div className="flex items-center gap-4">
              <select
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                className="px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white outline-none cursor-pointer"
                style={{ backgroundColor: '#1e293b' }}
              >
                <option value={1} className="bg-slate-800 text-white">1 Tháng</option>
                <option value={3} className="bg-slate-800 text-white">3 Tháng</option>
                <option value={6} className="bg-slate-800 text-white">6 Tháng</option>
                <option value={12} className="bg-slate-800 text-white">1 Năm</option>
              </select>
              <div className="text-white/60">
                Ngày hết hạn: <span className="font-medium text-white">{expiryDate}</span>
              </div>
            </div>
          </StepCard>

          {/* Submit Button */}
          <button
            onClick={assignCard}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-3"
          >
            <CheckCircle size={20} />
            Đăng ký vé tháng
          </button>
        </main>

        {/* New Customer Modal */}
        <SmallModal open={showNewCustomerModal} onClose={() => setShowNewCustomerModal(false)} title="Thêm khách hàng mới">
          <div className="space-y-4">
            <input
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 outline-none"
              placeholder="Họ tên"
              value={newCustomer.fullName}
              onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })}
            />
            <input
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 outline-none"
              placeholder="Số điện thoại"
              value={newCustomer.phoneNumber}
              onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })}
            />
            <input
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 outline-none"
              placeholder="CCCD"
              value={newCustomer.identityCard}
              onChange={(e) => setNewCustomer({ ...newCustomer, identityCard: e.target.value })}
            />
            <button
              onClick={createCustomer}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
            >
              Lưu và chọn
            </button>
          </div>
        </SmallModal>

        {/* New Vehicle Modal */}
        <SmallModal open={showNewVehicleModal} onClose={() => setShowNewVehicleModal(false)} title="Thêm xe mới">
          <div className="space-y-4">
            <input
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 outline-none"
              placeholder="Biển số"
              value={newVehicle.licensePlate}
              onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
            />
            <select
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none"
              value={newVehicle.type}
              onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
            >
              <option value="CAR">Ô tô</option>
              <option value="MOTORBIKE">Xe máy</option>
            </select>
            <input
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 outline-none"
              placeholder="Hãng xe"
              value={newVehicle.brand}
              onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
            />
            <input
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 outline-none"
              placeholder="Màu sắc"
              value={newVehicle.color}
              onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
            />
            <button
              onClick={createVehicle}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
            >
              Lưu và chọn
            </button>
          </div>
        </SmallModal>
      </div>
    </ConfigProvider>
  );
}
