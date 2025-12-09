import { useState, useEffect, useMemo } from "react";
import { Card, Table, Typography, Spin, message, ConfigProvider, theme, DatePicker, Row, Col, Statistic } from "antd";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { parkingSessionService } from "../services/parkingSessionService";
import dayjs from "dayjs";
import { ArrowUpOutlined, DollarOutlined } from "@ant-design/icons";

const { Title } = Typography;

const RevenueStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(dayjs());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await parkingSessionService.getMonthlyRevenue();
      // result is expected to be array of { month, year, totalRevenue }
      setRawData(result || []);
    } catch (error) {
      console.error(error);
      message.error("Không thể tải dữ liệu thống kê doanh thu");
    } finally {
      setLoading(false);
    }
  };

  const processedData = useMemo(() => {
    if (!rawData.length) return [];
    
    // Filter by selected year
    const year = selectedYear.year();
    const filtered = rawData.filter(item => item.year === year);
    
    // Fill missing months for better chart visualization
    const filledData = [];
    for (let i = 1; i <= 12; i++) {
        const found = filtered.find(item => item.month === i);
        filledData.push({
            month: i,
            year: year,
            name: `T${i}`,
            totalRevenue: found ? found.totalRevenue : 0,
            displayRevenue: found ? found.totalRevenue.toLocaleString() + " VND" : "0 VND"
        });
    }
    return filledData;
  }, [rawData, selectedYear]);

  const totalRevenueOfYear = useMemo(() => {
    return processedData.reduce((acc, curr) => acc + curr.totalRevenue, 0);
  }, [processedData]);

  const columns = [
    {
      title: "Tháng",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-semibold">{text}</span>
    },
    {
      title: "Năm",
      dataIndex: "year",
      key: "year",
    },
    {
      title: "Doanh thu",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      render: (value) => <span className="text-green-500 font-bold">{value.toLocaleString()} VND</span>,
      sorter: (a, b) => a.totalRevenue - b.totalRevenue,
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#722ed1', // Purple accent
          colorBgContainer: '#1f1f1f',
        },
      }}
    >
      <div className="p-6 min-h-screen bg-[#141414] text-white">
        <div className="mb-8 flex justify-between items-center">
            <div>
                <Title level={2} style={{ margin: 0, color: '#fff' }}>
                Thống kê Doanh thu
                </Title>
                <Typography.Text type="secondary">
                    Theo dõi doanh thu từ vé lượt theo thời gian thực
                </Typography.Text>
            </div>
            
            <div className="flex gap-4 items-center">
                <span className="text-gray-400">Chọn năm:</span>
                <DatePicker 
                    picker="year" 
                    value={selectedYear} 
                    onChange={setSelectedYear} 
                    allowClear={false}
                    className="w-32"
                />
            </div>
        </div>

        <Row gutter={[24, 24]} className="mb-8">
            <Col span={24} md={8}>
                <Card bordered={false} className="h-full shadow-lg bg-[#1f1f1f]">
                    <Statistic
                        title={<span className="text-gray-400">Tổng doanh thu năm {selectedYear.year()}</span>}
                        value={totalRevenueOfYear}
                        precision={0}
                        valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                        prefix={<DollarOutlined />}
                        suffix="VND"
                    />
                </Card>
            </Col>
            {/* Can add more summary cards here */}
        </Row>

        <Card className="mb-8 shadow-xl border-none bg-[#1f1f1f]" title={<span className="text-lg font-semibold">Biểu đồ tăng trưởng</span>}>
          {loading ? (
            <div className="flex justify-center h-[400px] items-center">
              <Spin size="large" />
            </div>
          ) : (
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={processedData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#722ed1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#722ed1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1890ff" />
                        <stop offset="100%" stopColor="#0050b3" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => value.toLocaleString() + " VND"}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  
                  <Bar 
                    name="Doanh thu (Cột)" 
                    dataKey="totalRevenue" 
                    fill="url(#barGradient)" 
                    barSize={40}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line 
                    type="monotone" 
                    name="Xu hướng" 
                    dataKey="totalRevenue" 
                    stroke="#722ed1" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#722ed1', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="shadow-xl border-none bg-[#1f1f1f]" title={<span className="text-lg font-semibold">Chi tiết theo tháng</span>}>
          <Table
            dataSource={processedData}
            columns={columns}
            rowKey="month"
            loading={loading}
            pagination={false}
            rowClassName="hover:bg-[#262626] transition-colors"
          />
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default RevenueStatistics;
