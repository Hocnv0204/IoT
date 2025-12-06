import { useEffect, useMemo, useState } from "react";
import { message, Tag } from "antd";
import { CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff, Home } from 'lucide-react';
import { customerService } from "../services/customerService";
import { vehicleService } from "../services/vehicleService";
import { cardService } from "../services/cardService";
import { parkingSessionService } from "../services/parkingSessionService";
import { websocketService } from "../services/websocketService";

function SmallModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="text-gray-500">
            Đóng
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function RegisterMonthly() {
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

  const expiryDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + Number(months));
    return d.toLocaleDateString();
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
      const resp = await cardService.assign({
        vehicleId: selectedVehicle.id,
        cardCode: uid,
        monthsDuration: Number(months),
      });
      
      const msg = "Đăng ký thẻ tháng thành công";
      message.success(msg);
      setResult({ 
          type: 'success', 
          title: 'Đăng ký thành công',
          message: msg 
      });

      // Reset
      setSelectedCustomer(null);
      setSelectedVehicle(null);
      setUid("");
      setMonths(1);
    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data?.message || "Lỗi khi đăng ký thẻ";
      message.error(errorMsg);
      setResult({ 
          type: 'error', 
          title: 'Đăng ký thất bại',
          message: errorMsg 
      });
    }
  };

  const [result, setResult] = useState(null); // { type: 'success' | 'error', title: '', message: '' }

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

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Đăng ký vé tháng</h2>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Về trang chủ"
          >
            <Home size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Custom Notification Area */}
        {result && (
          <div className={`mb-6 p-4 rounded-xl shadow-sm border-l-4 flex items-start gap-4 transition-all duration-500 animate-in fade-in slide-in-from-top-4 ${
            result.type === 'success' 
              ? 'bg-green-50 border-green-500 text-green-800' 
              : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            <div className={`p-2 rounded-full ${
              result.type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {result.type === 'success' ? <CheckCircle size={24} className="text-green-600"/> : <AlertTriangle size={24} className="text-red-600"/>}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-1">{result.title}</h4>
              <p className="opacity-90">{result.message}</p>
            </div>
            <button 
              onClick={() => setResult(null)}
              className={`p-1 rounded hover:bg-black/5 transition-colors ${
                result.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <XCircle size={20} />
            </button>
          </div>
        )}

        {/* ESP32 Connection Panel */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wifi className={esp32Connected ? "text-green-500" : "text-gray-400"} />
                <span className="font-semibold">Kết nối thiết bị đọc thẻ (ESP32)</span>
              </div>
              <Tag color={esp32Connected ? "green" : "red"}>
                {esp32Connected ? "Đã kết nối" : "Chưa kết nối"}
              </Tag>
            </div>

            <div className="flex gap-2">
              <input 
                value={esp32Ip}
                onChange={(e) => setEsp32Ip(e.target.value)}
                placeholder="Nhập IP ESP32 (VD: 192.168.1.x)"
                className="border rounded px-3 py-2 w-48"
                disabled={esp32Connected}
              />
              <button 
                onClick={handleConnectEsp32}
                className={`px-4 py-2 rounded flex items-center gap-2 text-white ${
                    esp32Connected ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {esp32Connected ? <WifiOff size={16}/> : <Wifi size={16}/>}
                {esp32Connected ? "Ngắt kết nối" : "Kết nối"}
              </button>
            </div>
        </div>

        {/* Step 1 */}
        <div className="mb-6">
          <h3 className="font-medium">Bước 1: Xác định Chủ xe</h3>
          <div className="flex gap-2 mt-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc SĐT"
              className="flex-1 border rounded-lg px-3 py-2"
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => setShowNewCustomerModal(true)}
            >
              Thêm khách hàng mới
            </button>
          </div>

          {suggestions.length > 0 && (
            <ul className="mt-2 border rounded bg-white max-h-48 overflow-auto">
              {suggestions.map((c) => (
                <li
                  key={c.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedCustomer(c);
                    setSuggestions([]);
                    setQuery("");
                  }}
                >
                  <div className="font-medium">{c.fullName}</div>
                  <div className="text-sm text-gray-500">{c.phoneNumber}</div>
                </li>
              ))}
            </ul>
          )}

          {selectedCustomer && (
            <div className="mt-3 p-3 border rounded bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{selectedCustomer.fullName}</div>
                  <div className="text-sm text-gray-600">
                    {selectedCustomer.phoneNumber}
                  </div>
                </div>
                <button
                  className="text-sm text-red-500"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 2 */}
        <div className="mb-6">
          <h3 className="font-medium">Bước 2: Xác định Xe đăng ký</h3>
          <div className="flex gap-2 mt-3">
            <input
              value={plateQuery}
              onChange={(e) => setPlateQuery(e.target.value)}
              placeholder="Tìm biển số thuộc khách hàng đã chọn"
              className="flex-1 border rounded-lg px-3 py-2"
              disabled={!selectedCustomer}
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => setShowNewVehicleModal(true)}
              disabled={!selectedCustomer}
            >
              Thêm xe mới
            </button>
          </div>

          {vehicleSuggestions.length > 0 && (
            <ul className="mt-2 border rounded bg-white max-h-48 overflow-auto">
              {vehicleSuggestions.map((v) => (
                <li
                  key={v.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedVehicle(v);
                    setVehicleSuggestions([]);
                    setPlateQuery("");
                  }}
                >
                  <div className="font-medium">{v.licensePlate}</div>
                  <div className="text-sm text-gray-500">
                    {v.type} • {v.brand} • {v.color}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {selectedVehicle && (
            <div className="mt-3 p-3 border rounded bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {selectedVehicle.licensePlate}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedVehicle.type} • {selectedVehicle.brand}
                  </div>
                </div>
                <button
                  className="text-sm text-red-500"
                  onClick={() => setSelectedVehicle(null)}
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 3 */}
        <div className="mb-6">
          <h3 className="font-medium">Bước 3: Nhập thông tin Thẻ</h3>
          
          <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
             <span className="text-sm text-purple-800">
               * Chuyển hệ thống sang chế độ ĐĂNG KÝ để nhận mã thẻ từ ESP32
             </span>
             <button
                onClick={async () => {
                    try {
                        const res = await parkingSessionService.setStatus("REGISTER");
                        const msg = res.message || "Đã chuyển sang chế độ ĐĂNG KÝ";
                        message.success(msg);
                        setResult({ 
                            type: 'success', 
                            title: 'Chuyển chế độ thành công',
                            message: msg 
                        });
                    } catch (e) {
                        console.error(e);
                        const errorMsg = e.response?.data?.message || "Lỗi khi chuyển chế độ";
                        message.error(errorMsg);
                        setResult({ 
                            type: 'error', 
                            title: 'Lỗi chuyển chế độ',
                            message: errorMsg 
                        });
                    }
                }}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
              >
                Bật chế độ Đăng ký
              </button>
          </div>

          <div className="mt-3">
            <input
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Nhập mã UID trên thẻ"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Step 4 */}
        <div className="mb-6">
          <h3 className="font-medium">Bước 4: Thiết lập gói dịch vụ</h3>
          <div className="mt-3 flex items-center gap-4">
            <select
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value={1}>1 Tháng</option>
              <option value={3}>3 Tháng</option>
              <option value={6}>6 Tháng</option>
              <option value={12}>1 Năm</option>
            </select>
            <div className="text-sm text-gray-600">
              Ngày hết hạn: <span className="font-medium">{expiryDate}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={assignCard}
            className="px-5 py-2 bg-green-600 text-white rounded"
          >
            Đăng ký
          </button>
        </div>
      </div>

      {/* New customer modal */}
      <SmallModal
        open={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        title="Thêm khách hàng mới"
      >
        <div className="space-y-3">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Họ tên"
            value={newCustomer.fullName}
            onChange={(e) =>
              setNewCustomer({ ...newCustomer, fullName: e.target.value })
            }
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="SĐT"
            value={newCustomer.phoneNumber}
            onChange={(e) =>
              setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })
            }
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="CCCD"
            value={newCustomer.identityCard}
            onChange={(e) =>
              setNewCustomer({ ...newCustomer, identityCard: e.target.value })
            }
          />
          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={createCustomer}
            >
              Lưu và chọn
            </button>
          </div>
        </div>
      </SmallModal>

      {/* New vehicle modal */}
      <SmallModal
        open={showNewVehicleModal}
        onClose={() => setShowNewVehicleModal(false)}
        title="Thêm xe mới"
      >
        <div className="space-y-3">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Biển số"
            value={newVehicle.licensePlate}
            onChange={(e) =>
              setNewVehicle({ ...newVehicle, licensePlate: e.target.value })
            }
          />
          <select
            className="w-full border rounded px-3 py-2"
            value={newVehicle.type}
            onChange={(e) =>
              setNewVehicle({ ...newVehicle, type: e.target.value })
            }
          >
            <option value="CAR">CAR</option>
            <option value="MOTORBIKE">MOTORBIKE</option>
          </select>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Hãng"
            value={newVehicle.brand}
            onChange={(e) =>
              setNewVehicle({ ...newVehicle, brand: e.target.value })
            }
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Màu"
            value={newVehicle.color}
            onChange={(e) =>
              setNewVehicle({ ...newVehicle, color: e.target.value })
            }
          />
          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={createVehicle}
            >
              Lưu và chọn
            </button>
          </div>
        </div>
      </SmallModal>
    </div>
  );
}
