import React, { useState, useEffect } from 'react';
import { Card, Tag, Descriptions, Typography, Spin, Empty } from 'antd';
import { Video, Car, CreditCard, User, Clock, FileText, AlertCircle } from 'lucide-react';
import { websocketService } from '../services/websocketService';

const { Title, Text } = Typography;

export default function MonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  
  // Placeholder for video streams - in production these would be real MJPEG streams
  const entryCameraUrl = "https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=1000&auto=format&fit=crop"; 
  const exitCameraUrl = "https://images.unsplash.com/photo-1590674899505-1c5c41951f89?q=80&w=1000&auto=format&fit=crop";

  useEffect(() => {
    const handleEvent = (data) => {
      console.log("New parking event:", data);
      setCurrentEvent(data);
    };

    websocketService.connect(
      () => {
        setConnected(true);
        setLoading(false);
      },
      (err) => {
        console.error("WS Error", err);
        setConnected(false);
        setLoading(false);
      }
    );

    const unsubscribe = websocketService.subscribe(handleEvent);

    return () => {
      unsubscribe();
      websocketService.disconnect();
    };
  }, []);

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
                src={entryCameraUrl} 
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
            bodyStyle={{ padding: 0 }}
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
