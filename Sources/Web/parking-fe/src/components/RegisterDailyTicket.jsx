import React, { useState, useEffect } from 'react';
import { message, ConfigProvider, theme } from 'antd';
import { Wifi, WifiOff, CreditCard, Save, Home, CheckCircle, XCircle, AlertTriangle, Radio } from 'lucide-react';
import { websocketService } from '../services/websocketService';
import { cardService } from '../services/cardService';
import { parkingSessionService } from '../services/parkingSessionService';
import { useNavigate } from '@tanstack/react-router';

export default function RegisterDailyTicket() {
  const navigate = useNavigate();
  const [esp32Ip, setEsp32Ip] = useState('192.168.2.16');
  const [esp32Connected, setEsp32Connected] = useState(false);
  const [scannedCardId, setScannedCardId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

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
          setScannedCardId(data.rfid);
          message.info(`Đã quét thẻ: ${data.rfid}`);
          return;
        }

        try {
          const json = JSON.parse(data);
          if (json.rfid || json.cardId) {
            const rfid = json.rfid || json.cardId;
            setScannedCardId(rfid);
            message.info(`Đã quét thẻ: ${rfid}`);
            return;
          }
        } catch (e) {
          if (typeof data === "string" && data.trim().length >= 8) {
            setScannedCardId(data.trim());
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

  const handleRegister = async () => {
    if (!scannedCardId) {
      message.error("Vui lòng quét thẻ trước khi đăng ký");
      return;
    }

    setResult(null);
    try {
      setLoading(true);
      await cardService.registerDaily(scannedCardId);
      const msg = "Đăng ký vé ngày thành công!";
      message.success(msg);
      setResult({ type: 'success', title: 'Thành công', message: msg });
      setScannedCardId('');
      
      setTimeout(() => {
        setResult(prev => (prev && prev.title === 'Thành công' ? null : prev));
      }, 5000);
    } catch (error) {
      console.error("Registration error:", error);
      let errorMsg = error.response?.data?.message || error.message || "Đăng ký thất bại. Vui lòng thử lại.";
      
      if (errorMsg && errorMsg.toLowerCase().includes("card already exists")) {
        errorMsg = "Thẻ này đã tồn tại trong hệ thống";
      }

      message.error(errorMsg);
      setResult({ type: 'error', title: 'Lỗi', message: errorMsg });
      
      setTimeout(() => {
        setResult(prev => (prev && prev.type === 'error' ? null : prev));
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

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
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Đăng ký vé ngày</h1>
                  <p className="text-sm text-white/60">Cấp vé lượt cho khách vãng lai</p>
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
            <div className={`p-4 rounded-xl border flex items-start gap-4 animate-in fade-in slide-in-from-top-4 ${
              result.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <div className={`p-2 rounded-full ${
                result.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'
              }`}>
                {result.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1">{result.title}</h4>
                <p className="opacity-90">{result.message}</p>
              </div>
              <button 
                onClick={() => setResult(null)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
          )}

          {/* ESP32 Connection Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  esp32Connected ? 'bg-emerald-500/20' : 'bg-white/10'
                }`}>
                  <Wifi className={`w-5 h-5 ${esp32Connected ? 'text-emerald-400' : 'text-white/40'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Thiết bị đọc thẻ (ESP32)</h3>
                  <p className="text-sm text-white/50">
                    {esp32Connected ? 'Đã kết nối' : 'Chưa kết nối'}
                  </p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${esp32Connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
            </div>

            <div className="flex gap-3">
              <input 
                value={esp32Ip}
                onChange={(e) => setEsp32Ip(e.target.value)}
                placeholder="Nhập IP ESP32 (VD: 192.168.1.x)"
                disabled={esp32Connected}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition outline-none disabled:opacity-50"
              />
              <button 
                onClick={handleConnectEsp32}
                className={`px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-all duration-300 ${
                  esp32Connected 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                }`}
              >
                {esp32Connected ? <WifiOff size={18}/> : <Wifi size={18}/>}
                {esp32Connected ? "Ngắt" : "Kết nối"}
              </button>
            </div>
            
            {/* Register Mode Button */}
            <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Radio className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-purple-300">
                    Chuyển hệ thống sang chế độ ĐĂNG KÝ
                  </span>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await parkingSessionService.setStatus("REGISTER");
                      const msg = res.message || "Đã chuyển sang chế độ ĐĂNG KÝ";
                      message.success(msg);
                      setResult({ type: 'success', title: 'Chuyển chế độ thành công', message: msg });
                    } catch (e) {
                      const errorMsg = e.response?.data?.message || "Lỗi khi chuyển chế độ";
                      message.error(errorMsg);
                      setResult({ type: 'error', title: 'Lỗi', message: errorMsg });
                    }
                  }}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition-colors"
                >
                  Bật chế độ Đăng ký
                </button>
              </div>
            </div>
          </div>

          {/* Card Scanner Section */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="mb-4">
              <h3 className="font-semibold text-white mb-1">Mã thẻ đã quét</h3>
              <p className="text-sm text-white/50">Đưa thẻ vào đầu đọc sau khi đã kết nối thiết bị</p>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl mb-6">
              <CreditCard className="w-6 h-6 text-blue-400" />
              <input 
                value={scannedCardId}
                placeholder="Chờ quét thẻ..."
                readOnly
                className="flex-1 bg-transparent text-xl font-mono text-white placeholder-white/30 outline-none"
              />
            </div>

            <button 
              onClick={handleRegister}
              disabled={!scannedCardId || loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>Đăng ký vé ngày</span>
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    </ConfigProvider>
  );
}
