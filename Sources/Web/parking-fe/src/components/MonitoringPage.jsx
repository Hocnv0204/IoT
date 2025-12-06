import React, { useState, useEffect } from 'react';
import { Card, Tag, Descriptions, Typography, Spin, Empty, Input } from 'antd';
import { Video, Car, CreditCard, User, Clock, FileText, AlertCircle, LogIn, LogOut } from 'lucide-react';
import { websocketService } from '../services/websocketService';
import { parkingSessionService } from '../services/parkingSessionService';

const { Title, Text } = Typography;

export default function MonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [scannedCardId, setScannedCardId] = useState('');
  
  // ESP32 Integration State
  const [esp32Ip, setEsp32Ip] = useState('192.168.2.16'); // Default IP from user logs
  const [esp32Connected, setEsp32Connected] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  
  // Placeholder for video streams - in production these would be real MJPEG streams
  const entryCameraUrl = "https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=1000&auto=format&fit=crop"; 
  const exitCameraUrl = "https://images.unsplash.com/photo-1590674899505-1c5c41951f89?q=80&w=1000&auto=format&fit=crop";

  useEffect(() => {
    const handleEvent = (data) => {
      console.log("New parking event:", data);
      
      // Log specifically for ESP32 data
      if (data.rfid) {
        console.log("✅ [ESP32] Received RFID data from ESP32:", data.rfid);
      }

      setCurrentEvent(data);
      if (data.rfid) {
        setScannedCardId(data.rfid);
      }
    };

    websocketService.connect(
      () => {
        console.log("🚀 [System] Frontend connected to Backend WebSocket. Ready to receive ESP32 events.");
        setConnected(true);
        setLoading(false);
      },
      (err) => {
        console.error("❌ [System] WebSocket Connection Error:", err);
        setConnected(false);
        setLoading(false);
      }
    );

    const unsubscribe = websocketService.subscribe(handleEvent);

    return () => {
      unsubscribe();
      websocketService.disconnect();
      websocketService.disconnectEsp32();
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, []);

  // Handle ESP32 Connection
  const handleConnectEsp32 = () => {
    if (esp32Connected) {
        websocketService.disconnectEsp32();
        setEsp32Connected(false);
        setVideoUrl(null);
        return;
    }

    websocketService.connectToEsp32(
        esp32Ip,
        () => {
            console.log("✅ [ESP32] Connected to Camera & RFID");
            setEsp32Connected(true);
        },
        (data) => {
            if (data.type === 'CHECK_IN') {
                console.log("✅ [ESP32] RFID Scanned:", data.rfid);
                setScannedCardId(data.rfid);
                // Optional: Send to backend if needed, but currently just displaying
            } else if (data.type === 'VIDEO_FRAME') {
                // Create Blob from ArrayBuffer
                const blob = new Blob([data.data], { type: 'image/jpeg' });
                const url = URL.createObjectURL(blob);
                setVideoUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev); // Clean up old URL
                    return url;
                });
            }
        },
        () => {
            console.log("❌ [ESP32] Disconnected");
            setEsp32Connected(false);
            setVideoUrl(null);
        }
    );
  };


  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <Video className="w-8 h-8 text-blue-600" />
            <div>
              <Title level={4} className="!mb-0">Hệ thống Giám sát Bãi đỗ xe</Title>
              <Text type="secondary">Real-time Vehicle Monitoring System</Text>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <Text strong>{connected ? 'Hệ thống Online' : 'Mất kết nối'}</Text>
          </div>
        </div>

        {/* ESP32 Connection Panel */}
        <Card className="shadow-sm border-l-4 border-l-orange-500">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <Text strong>ESP32 IP:</Text>
                    <Input 
                        value={esp32Ip} 
                        onChange={(e) => setEsp32Ip(e.target.value)} 
                        placeholder="192.168.1.x" 
                        style={{ width: '150px' }}
                        disabled={esp32Connected}
                    />
                </div>
                <button 
                    onClick={handleConnectEsp32}
                    className={`px-4 py-2 rounded font-bold text-white transition-colors ${
                        esp32Connected 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                >
                    {esp32Connected ? 'Ngắt kết nối ESP32' : 'Kết nối ESP32'}
                </button>
                {esp32Connected && <Tag color="green">Đã kết nối Camera & RFID</Tag>}
            </div>
        </Card>

        {/* Status Control Panel */}
        <Card className="shadow-sm border-l-4 border-l-blue-500">
            <div className="flex items-center gap-4 flex-wrap">
                <Text strong className="text-lg">Điều khiển trạng thái:</Text>
                <button 
                    onClick={async () => {
                        try {
                            await parkingSessionService.setStatus("CHECKIN");
                            alert("Đã set trạng thái: CHECKIN");
                        } catch (e) {
                            console.error(e);
                            alert("Lỗi khi set trạng thái");
                        }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <LogIn size={18} />
                    Check In
                </button>
                <button 
                    onClick={async () => {
                        try {
                            await parkingSessionService.setStatus("CHECKOUT");
                            alert("Đã set trạng thái: CHECKOUT");
                        } catch (e) {
                            console.error(e);
                            alert("Lỗi khi set trạng thái");
                        }
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded font-bold hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                    <LogOut size={18} />
                    Check Out
                </button>
            </div>
        </Card>

        {/* Card Scanner Input */}
        <Card className="shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-blue-600">
               <CreditCard size={24} />
               <Text strong className="text-lg">Mã thẻ vừa quét:</Text>
            </div>
            <Input 
                value={scannedCardId} 
                onChange={(e) => setScannedCardId(e.target.value)} 
                placeholder="Chờ quẹt thẻ..." 
                style={{ maxWidth: '400px', fontSize: '1.2em', fontWeight: 'bold', color: '#1890ff' }}
                readOnly
            />
            <Text type="secondary" className="text-xs">(Dữ liệu từ ESP32-CAM)</Text>
          </div>
        </Card>

        {/* Video Feeds */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Entry Camera */}
          <Card 
            title={<div className="flex items-center gap-2"><Video size={18}/> Camera Lối vào (Entry)</div>}
            className="shadow-md overflow-hidden"
            styles={{ body: { padding: 0 } }}
          >
            <div className="relative aspect-video bg-black flex items-center justify-center group">
              <img 
                src={videoUrl || entryCameraUrl} 
                alt="Entry Camera" 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute top-4 right-4 bg-red-600 text-white text-xs px-2 py-1 rounded animate-pulse">
                LIVE
              </div>
              
              {/* Overlay Image from BE when swiping at Entry */}
              {currentEvent?.type === 'CHECK_IN' && currentEvent?.imageUrl && (
                <div className="absolute inset-0 z-10 bg-black/90 flex items-center justify-center">
                   <img src={`http://localhost:8080${currentEvent.imageUrl}`} alt="Captured Plate" className="w-full h-full object-contain" />
                   <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-2">
                      Ảnh chụp lúc {new Date(currentEvent.checkInAt || Date.now()).toLocaleTimeString()}
                   </div>
                </div>
              )}
            </div>
          </Card>

          {/* Exit Camera */}
          <Card 
            title={<div className="flex items-center gap-2"><Video size={18}/> Camera Lối ra (Exit)</div>}
            className="shadow-md overflow-hidden"
            styles={{ body: { padding: 0 } }}
          >
            <div className="relative aspect-video bg-black flex items-center justify-center group">
              <img 
                src={exitCameraUrl} 
                alt="Exit Camera" 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute top-4 right-4 bg-red-600 text-white text-xs px-2 py-1 rounded animate-pulse">
                LIVE
              </div>

              {/* Overlay Image from BE when swiping at Exit */}
              {currentEvent?.type === 'CHECK_OUT' && currentEvent?.imageUrl && (
                <div className="absolute inset-0 z-10 bg-black/90 flex items-center justify-center">
                   <img src={`http://localhost:8080${currentEvent.imageUrl}`} alt="Captured Plate" className="w-full h-full object-contain" />
                   <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-2">
                      Ảnh chụp lúc {new Date(currentEvent.checkOutAt || Date.now()).toLocaleTimeString()}
                   </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Transaction Info Panel */}
        <Card className="shadow-lg border-t-4 border-t-blue-600">
          {!currentEvent ? (
             <div className="text-center py-12 text-gray-400">
               <Car className="w-16 h-16 mx-auto mb-4 opacity-20" />
               <Text className="text-lg">Chờ quẹt thẻ...</Text>
               <p className="text-sm mt-2">Thông tin xe sẽ hiển thị tại đây khi có lượt ra/vào</p>
             </div>
          ) : (currentEvent.status === "DENIED") ? (
            <div className="text-center py-12">
               <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6 animate-bounce">
                 <AlertCircle className="w-10 h-10 text-red-600" />
               </div>
               <h3 className="text-2xl font-bold text-red-600 mb-2">CẢNH BÁO: BIỂN SỐ KHÔNG KHỚP!</h3>
               <p className="text-gray-600 text-lg">Hệ thống phát hiện biển số xe ra không trùng khớp với lúc vào.</p>
               <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg inline-block text-left">
                 <p className="font-semibold text-red-800">Chi tiết lỗi:</p>
                 <ul className="list-disc list-inside text-red-700 mt-1">
                   <li>Trạng thái: {currentEvent.status}</li>
                   <li>Biển số: {currentEvent.licensePlate}</li>
                   <li>Thông điệp: {currentEvent.message || "License plate mismatch"}</li>
                 </ul>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Vehicle & Owner Info */}
              <div className="lg:col-span-2 space-y-6">
                 <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Car className="text-blue-600"/> 
                      Thông tin xe & Chủ sở hữu
                    </h3>
                    <Tag color={currentEvent.type === 'CHECK_IN' ? 'green' : 'orange'} className="text-lg px-4 py-1">
                      {currentEvent.type === 'CHECK_IN' ? 'XE VÀO (CHECK-IN)' : 'XE RA (CHECK-OUT)'}
                    </Tag>
                 </div>
                 
                 <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                    {/* <Descriptions.Item label={<span className="flex items-center gap-2"><CreditCard size={16}/> Mã thẻ</span>}> */}
                      {/* <Text strong copyable>{currentEvent.cardId || 'N/A'}</Text> */}
                    {/* </Descriptions.Item> */}
                    <Descriptions.Item label={<span className="flex items-center gap-2"><User size={16}/> Chủ xe</span>}>
                      <Text strong className="text-blue-700 text-lg">{currentEvent.ownerName || 'Khách vãng lai'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Biển số xe">
                      <div className="bg-yellow-100 border-2 border-black px-4 py-1 rounded font-mono font-bold inline-block">
                        {currentEvent.licensePlate || '--- -- ---'}
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="Loại xe">
                      <Tag color="blue">{currentEvent.vehicleType || 'Xe máy'}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={<span className="flex items-center gap-2"><FileText size={16}/> Mô tả</span>} span={2}>
                      {currentEvent.description || 'Không có mô tả thêm'}
                    </Descriptions.Item>
                 </Descriptions>
              </div>

              {/* Right: Transaction Details */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="text-blue-600"/> Chi tiết giao dịch
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Text type="secondary">Thời gian vào:</Text>
                    <Text strong>{formatDate(currentEvent.checkInAt || currentEvent.checkInTime)}</Text>
                  </div>
                  
                  {currentEvent.type === 'CHECK_OUT' && (
                    <div className="flex justify-between items-center">
                      <Text type="secondary">Thời gian ra:</Text>
                      <Text strong>{formatDate(currentEvent.checkOutAt || currentEvent.checkOutTime)}</Text>
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <Text>Loại vé:</Text>
                      <Tag color={currentEvent.cardType === 'MONTHLY' ? 'purple' : 'cyan'}>
                        {currentEvent.cardType === 'MONTHLY' ? 'VÉ THÁNG' : 'VÉ LƯỢT'}
                      </Tag>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 bg-white p-4 rounded-lg shadow-sm border">
                      <Text strong className="text-lg">Phí đỗ xe:</Text>
                      <Text className="text-2xl font-bold text-red-600">
                        {currentEvent.ticketType === 'MONTHLY' ? '0 đ' : formatCurrency(currentEvent.feeCalculated || 0)}
                      </Text>
                    </div>
                    {currentEvent.ticketType === 'MONTHLY' && (
                       <div className="text-center mt-2 text-green-600 text-sm flex items-center justify-center gap-1">
                         <AlertCircle size={14}/> Đã thanh toán tháng
                       </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
