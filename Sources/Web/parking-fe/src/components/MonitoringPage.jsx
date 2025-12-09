import React, { useState, useEffect } from 'react';
import { Tag, message, ConfigProvider, theme } from 'antd';
import { Video, Car, CreditCard, User, Clock, FileText, AlertCircle, LogIn, LogOut, CheckCircle, XCircle, AlertTriangle, Home, Wifi, WifiOff, Monitor } from 'lucide-react';
import { websocketService } from '../services/websocketService';
import { parkingSessionService } from '../services/parkingSessionService';
import { useNavigate } from '@tanstack/react-router';

export default function MonitoringPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [scannedCardId, setScannedCardId] = useState('');
  
  // ESP32 Integration State
  const [esp32Ip, setEsp32Ip] = useState('192.168.2.16');
  const [esp32Connected, setEsp32Connected] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [activeStreamTarget, setActiveStreamTarget] = useState('ENTRY');

  const entryCameraUrl = "https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=1000&auto=format&fit=crop"; 
  const exitCameraUrl = "https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=1000&auto=format&fit=crop";

  useEffect(() => {
    const handleEvent = (data) => {
      console.log("New parking event:", data);

      if (data.rfid) {
        console.log("✅ [ESP32] Received RFID data from ESP32:", data.rfid);
      }

      // Handle "Not found card" error
      if (data.message === "Not found card" || data.apiErrorResponse?.code === 404) {
        const msg = "Thẻ chưa được đăng ký trong hệ thống";
        message.error(msg, 5);
        setResult({ type: 'error', title: 'Lỗi quẹt thẻ', message: msg });
        setTimeout(() => setResult(prev => (prev && prev.message === msg ? null : prev)), 5000);
        setCurrentEvent({ ...data, status: "NOT_FOUND", ownerName: "Chưa đăng ký", licensePlate: "Unknown", vehicleType: "Unknown" });
        if (data.rfid) setScannedCardId(data.rfid);
        return;
      }

      // Handle "Vehicle already in park" error (409)
      if (data.message === "Vehicle already in park" || data.apiErrorResponse?.code === 409) {
        const msg = "Xe đã ở trong bãi! Không thể check-in lại.";
        message.error(msg, 5);
        setResult({ type: 'error', title: 'Lỗi Check-in', message: msg });
        setTimeout(() => setResult(prev => (prev && prev.message === msg ? null : prev)), 5000);
        setCurrentEvent({ ...data, status: "ALREADY_IN_PARK" });
        if (data.rfid) setScannedCardId(data.rfid);
        return;
      }

      // Handle "Vehicle already out park" error
      if (data.message === "Vehicle already out park") {
        const msg = "Xe không có trong bãi! Không thể check-out.";
        message.error(msg, 5);
        setResult({ type: 'error', title: 'Lỗi Check-out', message: msg });
        setTimeout(() => setResult(prev => (prev && prev.message === msg ? null : prev)), 5000);
        setCurrentEvent({ ...data, status: "ALREADY_OUT_PARK" });
        if (data.rfid) setScannedCardId(data.rfid);
        return;
      }

      // Handle WebSocket Error Notifications
      if (data.type === 'ERROR_NOTIFICATION') {
        let errorMsg = data.errorMessage || data.message || "Có lỗi xảy ra";
        let errorTitle = `Lỗi ${data.errorCode || 'Hệ thống'}`;
        if (errorMsg === "Not found card") { errorMsg = "Thẻ chưa được đăng ký trong hệ thống"; errorTitle = "Lỗi quẹt thẻ"; }
        if (errorMsg === "Vehicle already in park") { errorMsg = "Xe đã ở trong bãi! Không thể check-in lại."; errorTitle = "Lỗi Check-in"; }
        if (errorMsg === "Vehicle already out park") { errorMsg = "Xe không có trong bãi! Không thể check-out."; errorTitle = "Lỗi Check-out"; }
        message.error(errorMsg, 5);
        setResult({ type: 'error', title: errorTitle, message: errorMsg });
        setTimeout(() => setResult(prev => (prev && prev.message === errorMsg ? null : prev)), 5000);
        if (data.rfid) setScannedCardId(data.rfid);
        return;
      }

      setCurrentEvent(data);
      if (data.rfid) setScannedCardId(data.rfid);
    };

    websocketService.connect(
      () => { setConnected(true); setLoading(false); },
      () => { setConnected(false); setLoading(false); }
    );

    const unsubscribe = websocketService.subscribe(handleEvent);
    return () => { unsubscribe(); websocketService.disconnect(); websocketService.disconnectEsp32(); if (videoUrl) URL.revokeObjectURL(videoUrl); };
  }, []);

  // Auto-clear event after 10 seconds to revert to video stream
  useEffect(() => {
    if (currentEvent) {
      const timer = setTimeout(() => {
        setCurrentEvent(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [currentEvent]);

  const handleConnectEsp32 = () => {
    if (esp32Connected) {
      websocketService.disconnectEsp32();
      setEsp32Connected(false);
      setVideoUrl(null);
      return;
    }

    websocketService.connectToEsp32(
      esp32Ip,
      () => { setEsp32Connected(true); },
      (data) => {
        if (data.type === 'CHECK_IN') setScannedCardId(data.rfid);
        else if (data.type === 'VIDEO_FRAME') {
          const blob = new Blob([data.buffer], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          setVideoUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
        }
      },
      () => { setEsp32Connected(false); setVideoUrl(null); }
    );
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('vi-VN') : "-";
  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const handleStatusChange = async (status, target) => {
    setActiveStreamTarget(target);
    try {
      const res = await parkingSessionService.setStatus(status);
      const msg = res.message || `Đã chuyển trạng thái: ${status}`;
      message.success(msg);
      setResult({ type: 'success', title: 'Chuyển trạng thái thành công', message: msg });
      setTimeout(() => setResult(prev => (prev && prev.type === 'success' ? null : prev)), 3000);
    } catch (e) {
      const errorMsg = e.response?.data?.message || "Lỗi khi set trạng thái";
      message.error(errorMsg);
      setResult({ type: 'error', title: 'Lỗi chuyển trạng thái', message: errorMsg });
    }
  };

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: { colorBgContainer: 'rgba(255,255,255,0.05)', colorBorder: 'rgba(255,255,255,0.1)', colorText: 'rgba(255,255,255,0.85)' } }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Giám sát bãi đỗ xe</h1>
                  <p className="text-sm text-white/60">Real-time Vehicle Monitoring</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
                  <span className="text-white/80 text-sm">{connected ? 'Online' : 'Offline'}</span>
                </div>
                <button onClick={() => navigate({ to: '/dashboard' })} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg transition-all">
                  <Home className="w-4 h-4" /><span className="hidden sm:inline">Trang chủ</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* ESP32 Connection */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${esp32Connected ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
                  <Wifi className={`w-5 h-5 ${esp32Connected ? 'text-emerald-400' : 'text-white/40'}`} />
                </div>
                <input value={esp32Ip} onChange={(e) => setEsp32Ip(e.target.value)} placeholder="IP ESP32" disabled={esp32Connected} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 outline-none w-40" />
              </div>
              <button onClick={handleConnectEsp32} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-all ${esp32Connected ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {esp32Connected ? <WifiOff size={18}/> : <Wifi size={18}/>}
                {esp32Connected ? "Ngắt" : "Kết nối ESP32"}
              </button>
              {esp32Connected && <Tag color="green">Đã kết nối Camera & RFID</Tag>}
            </div>
          </div>

          {/* Result Notification */}
          {result && (
            <div className={`p-4 rounded-xl border flex items-start gap-4 ${result.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              <div className={`p-2 rounded-full ${result.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                {result.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1">{result.title}</h4>
                <p className="opacity-90">{result.message}</p>
              </div>
              <button onClick={() => setResult(null)} className="p-1 rounded hover:bg-white/10"><XCircle size={20} /></button>
            </div>
          )}

          {/* Status Control */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-white font-medium">Điều khiển:</span>
              <button onClick={() => handleStatusChange("CHECKIN", "ENTRY")} className={`px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-all ${activeStreamTarget === 'ENTRY' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}>
                <LogIn size={18} />Check In
              </button>
              <button onClick={() => handleStatusChange("CHECKOUT", "EXIT")} className={`px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-all ${activeStreamTarget === 'EXIT' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'}`}>
                <LogOut size={18} />Check Out
              </button>
            </div>
          </div>


          {/* Video Feeds */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Entry Camera */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                <Video size={18} className="text-emerald-400" />
                <span className="text-white font-medium">Camera Lối vào</span>
                {activeStreamTarget === 'ENTRY' && <span className="ml-auto text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">ACTIVE</span>}
              </div>
              <div className="relative aspect-video bg-black">
                <img src={(activeStreamTarget === 'ENTRY' && videoUrl) ? videoUrl : entryCameraUrl} alt="Entry Camera" className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-red-600 text-white text-xs px-2 py-1 rounded animate-pulse">LIVE</div>
                {currentEvent?.type === 'CHECK_IN' && currentEvent?.imageUrl && (
                  <div className="absolute inset-0 z-10 bg-black/90 flex items-center justify-center">
                    <img src={`http://localhost:8080${currentEvent.imageUrl}`} alt="Captured" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            {/* Exit Camera */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                <Video size={18} className="text-orange-400" />
                <span className="text-white font-medium">Camera Lối ra</span>
                {activeStreamTarget === 'EXIT' && <span className="ml-auto text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded">ACTIVE</span>}
              </div>
              <div className="relative aspect-video bg-black">
                <img src={(activeStreamTarget === 'EXIT' && videoUrl) ? videoUrl : exitCameraUrl} alt="Exit Camera" className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-red-600 text-white text-xs px-2 py-1 rounded animate-pulse">LIVE</div>
                {currentEvent?.type === 'CHECK_OUT' && currentEvent?.imageUrl && (
                  <div className="absolute inset-0 z-10 bg-black/90 flex items-center justify-center">
                    <img src={`http://localhost:8080${currentEvent.imageUrl}`} alt="Captured" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            {!currentEvent ? (
              <div className="text-center py-12">
                <Car className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <p className="text-white/60 text-lg">Chờ quẹt thẻ...</p>
                <p className="text-white/40 text-sm mt-2">Thông tin xe sẽ hiển thị tại đây</p>
              </div>
            ) : currentEvent.status === "NOT_FOUND" ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-10 h-10 text-white/40" />
                </div>
                <h3 className="text-2xl font-bold text-white/60 mb-2">THẺ CHƯA ĐƯỢC ĐĂNG KÝ</h3>
                <p className="text-white/40">Vui lòng đăng ký thẻ trước khi sử dụng.</p>
              </div>
            ) : currentEvent.status === "ALREADY_IN_PARK" ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <AlertTriangle className="w-10 h-10 text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold text-orange-400 mb-2">XE ĐÃ Ở TRONG BÃI</h3>
                <p className="text-white/60">Hệ thống ghi nhận xe này đã check-in và chưa check-out.</p>
                {currentEvent.licensePlate && <p className="text-white font-bold mt-2 text-xl">{currentEvent.licensePlate}</p>}
              </div>
            ) : currentEvent.status === "ALREADY_OUT_PARK" ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-red-400 mb-2">XE KHÔNG CÓ TRONG BÃI</h3>
                <p className="text-white/60">Không thể check-out vì xe chưa check-in.</p>
              </div>
            ) : currentEvent.status === "DENIED" ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-red-500 mb-2">CẢNH BÁO: BIỂN SỐ KHÔNG KHỚP!</h3>
                <p className="text-white/60 mb-6">Hệ thống phát hiện biển số xe không khớp với dữ liệu đăng ký.</p>
                
                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                    <div className="text-center p-3 bg-black/20 rounded-lg">
                        <div className="text-white/50 text-xs mb-1">Biển số quét được (AI)</div>
                        <div className="text-amber-400 font-mono font-bold text-xl">{currentEvent.licensePlate || 'Unknown'}</div>
                    </div>
                    <div className="text-center p-3 bg-black/20 rounded-lg">
                        <div className="text-white/50 text-xs mb-1">Biển số đăng ký</div>
                        <div className="text-emerald-400 font-mono font-bold text-xl">{currentEvent.registeredLicensePlate || 'Unknown'}</div>
                    </div>
                    <div className="col-span-2 text-center pt-2 border-t border-red-500/20">
                        <div className="text-white/50 text-xs mb-1">Chủ xe</div>
                        <div className="text-white font-medium text-lg">{currentEvent.ownerName || 'Unknown'}</div>
                    </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vehicle Info */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Car className="text-blue-400" />Thông tin xe
                    </h3>
                    <Tag color={currentEvent.type === 'CHECK_IN' ? 'green' : 'orange'} className="text-base px-3 py-1">
                      {currentEvent.type === 'CHECK_IN' ? 'XE VÀO' : 'XE RA'}
                    </Tag>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-white/50 text-sm mb-1 flex items-center gap-2"><User size={14} />Chủ xe</div>
                      <div className="text-white font-medium">{currentEvent.ownerName || 'Khách vãng lai'}</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-white/50 text-sm mb-1">Biển số xe</div>
                      <div className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded font-mono font-bold inline-block">
                        {currentEvent.licensePlate || '---'}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-white/50 text-sm mb-1">Loại xe</div>
                      <Tag color="blue">{currentEvent.vehicleType || 'Xe máy'}</Tag>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-white/50 text-sm mb-1 flex items-center gap-2"><FileText size={14} />Mô tả</div>
                      <div className="text-white/80">{currentEvent.description || 'Không có'}</div>
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="text-blue-400" />Chi tiết giao dịch
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-white/50">Thời gian vào:</span><span className="text-white">{formatDate(currentEvent.checkInAt || currentEvent.checkInTime)}</span></div>
                    {currentEvent.type === 'CHECK_OUT' && (
                      <>
                        <div className="flex justify-between"><span className="text-white/50">Thời gian ra:</span><span className="text-white">{formatDate(currentEvent.checkOutAt || currentEvent.checkOutTime)}</span></div>
                        {currentEvent.checkInImageUrl && (
                          <div className="mt-4">
                            <div className="text-white/50 text-sm mb-2">Ảnh lúc vào:</div>
                            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/10">
                              <img src={`http://localhost:8080${currentEvent.checkInImageUrl}`} alt="Check-in" className="w-full h-full object-contain" />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <div className="border-t border-white/10 pt-4 mt-4">
                      <div className="flex justify-between mb-2"><span className="text-white/50">Loại vé:</span><Tag color={currentEvent.cardType === 'MONTHLY' ? 'purple' : 'cyan'}>{currentEvent.cardType === 'MONTHLY' ? 'VÉ THÁNG' : 'VÉ LƯỢT'}</Tag></div>
                      <div className="bg-white/10 rounded-xl p-4 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">Phí đỗ xe:</span>
                          <span className="text-2xl font-bold text-emerald-400">{currentEvent.ticketType === 'MONTHLY' ? '0 đ' : formatCurrency(currentEvent.feeCalculated || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ConfigProvider>
  );
}
