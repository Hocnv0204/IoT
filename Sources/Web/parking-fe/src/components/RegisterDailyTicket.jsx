import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Typography, Tag, message, Alert } from 'antd';
import { Wifi, WifiOff, CreditCard, Save, Home } from 'lucide-react';
import { websocketService } from '../services/websocketService';
import { cardService } from '../services/cardService';
import { parkingSessionService } from '../services/parkingSessionService';

const { Title, Text } = Typography;

export default function RegisterDailyTicket() {
  const [esp32Ip, setEsp32Ip] = useState('192.168.2.16');
  const [esp32Connected, setEsp32Connected] = useState(false);
  const [scannedCardId, setScannedCardId] = useState('');
  const [loading, setLoading] = useState(false);

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
}
,

      () => {
        message.warning("Đã ngắt kết nối ESP32");
        setEsp32Connected(false);
      }
    );
  };

  const [result, setResult] = useState(null); // { type: 'success' | 'error', message: '' }

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
      setResult({ type: 'success', message: msg });
      setScannedCardId('');
    } catch (error) {
      console.error("Registration error:", error);
      const errorMsg = error.response?.data?.message || error.message || "Đăng ký thất bại. Vui lòng thử lại.";
      message.error(errorMsg);
      setResult({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <Title level={2}>Đăng ký vé ngày</Title>
            <Text type="secondary">Kết nối với thiết bị đọc thẻ và đăng ký vé lượt cho khách vãng lai</Text>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Về trang chủ"
          >
            <Home size={24} className="text-gray-600" />
          </button>
        </div>

        {result && (
          <div className="mb-6">
            <Alert
              message={result.type === 'success' ? "Thành công" : "Lỗi"}
              description={result.message}
              type={result.type}
              showIcon
              closable
              onClose={() => setResult(null)}
            />
          </div>
        )}

        <Card className="shadow-md mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wifi className={esp32Connected ? "text-green-500" : "text-gray-400"} />
                <Text strong>Kết nối thiết bị đọc thẻ (ESP32)</Text>
              </div>
              <Tag color={esp32Connected ? "green" : "red"}>
                {esp32Connected ? "Đã kết nối" : "Chưa kết nối"}
              </Tag>
            </div>

            <div className="flex gap-2">
              <Input 
                value={esp32Ip}
                onChange={(e) => setEsp32Ip(e.target.value)}
                placeholder="Nhập IP ESP32 (VD: 192.168.1.x)"
                disabled={esp32Connected}
              />
              <Button 
                type={esp32Connected ? "default" : "primary"}
                onClick={handleConnectEsp32}
                danger={esp32Connected}
                icon={esp32Connected ? <WifiOff size={16}/> : <Wifi size={16}/>}
              >
                {esp32Connected ? "Ngắt kết nối" : "Kết nối"}
              </Button>
            </div>
            
            <div className="border-t pt-4 mt-2">
               <div className="flex items-center justify-between">
                  <Text>Chế độ hệ thống:</Text>
                  <Button 
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
                    className="bg-purple-600 text-white hover:bg-purple-700 border-purple-600"
                  >
                    Chuyển sang Chế độ Đăng ký
                  </Button>
               </div>
               <Text type="secondary" className="text-xs mt-1 block">
                 * Chuyển sang chế độ này để ESP32 gửi mã thẻ về mà không xử lý ra/vào
               </Text>
            </div>
          </div>
        </Card>

        <Card className="shadow-md">
          <div className="space-y-6">
            <div>
              <Text strong className="block mb-2">Mã thẻ đã quét</Text>
              <div className="flex items-center gap-2">
                <Input 
                  size="large"
                  prefix={<CreditCard className="text-gray-400" />}
                  value={scannedCardId}
                  placeholder="Chờ quét thẻ..."
                  readOnly
                  className="font-mono text-lg"
                />
              </div>
              <Text type="secondary" className="text-xs mt-1">
                * Đưa thẻ vào đầu đọc sau khi đã kết nối thiết bị
              </Text>
            </div>

            <Button 
              type="primary" 
              size="large" 
              block 
              onClick={handleRegister}
              loading={loading}
              disabled={!scannedCardId}
              icon={<Save size={20} />}
              className="h-12 text-lg font-medium bg-green-600 hover:bg-green-700"
            >
              Đăng ký vé ngày
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
