import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { DatePicker, Select, Input, Table, Tag, ConfigProvider, theme } from "antd";
import { Home, ClipboardList, Search, Calendar, Filter, RefreshCw } from "lucide-react";
import { authService } from "../services/authService";
import { parkingSessionService } from "../services/parkingSessionService";

const { RangePicker } = DatePicker;

const statusColorMap = {
  IN: "green",
  OUT: "blue",
};

export default function HistoryLogs() {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();

  const [logs, setLogs] = useState([]);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState();
  const [licensePlate, setLicensePlate] = useState("");
  const [dateRange, setDateRange] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [navigate, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLogs(pageNumber, pageSize);
  }, [pageNumber, pageSize, status, licensePlate, dateRange, isAuthenticated]);

  const fetchLogs = async (page, size) => {
    try {
      setLoading(true);
      const [fromDate, toDate] = dateRange || [];

      const data = await parkingSessionService.getLogs({
        pageNumber: page,
        pageSize: size,
        status,
        licensePlate: licensePlate || undefined,
        fromDate: fromDate ? fromDate.toDate() : undefined,
        toDate: toDate ? toDate.toDate() : undefined,
        sortBy: "timeIn",
        orderBy: "DESC",
      });

      setLogs(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error("Lỗi khi tải lịch sử ra vào:", err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Biển số xe",
      dataIndex: "licensePlate",
      key: "licensePlate",
      render: (plate) => (
        <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded font-mono font-semibold">
          {plate}
        </span>
      ),
    },
    {
      title: "Chủ xe",
      dataIndex: "ownerName",
      key: "ownerName",
      render: (name) => <span className="text-white/80">{name || '-'}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Tag color={statusColorMap[value] || "default"}>
          {value === "IN"
            ? "Đang đỗ (IN)"
            : value === "OUT"
            ? "Đã rời bãi (OUT)"
            : value}
        </Tag>
      ),
    },
    {
      title: "Thời gian vào",
      dataIndex: "timeIn",
      key: "timeIn",
      render: (value) => (
        <span className="text-white/70">
          {value ? new Date(value).toLocaleString("vi-VN") : "-"}
        </span>
      ),
    },
    {
      title: "Thời gian ra",
      dataIndex: "timeOut",
      key: "timeOut",
      render: (value) => (
        <span className="text-white/70">
          {value ? new Date(value).toLocaleString("vi-VN") : "-"}
        </span>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgContainer: 'rgba(255, 255, 255, 0.05)',
          colorBorder: 'rgba(255, 255, 255, 0.1)',
          colorText: 'rgba(255, 255, 255, 0.85)',
          colorTextPlaceholder: 'rgba(255, 255, 255, 0.4)',
        },
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Lịch sử ra vào</h1>
                  <p className="text-sm text-white/60">Tra cứu chi tiết các lượt xe</p>
                </div>
              </div>
              
              <button
                onClick={() => navigate({ to: "/dashboard" })}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg transition-all duration-300"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Trang chủ</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Filter Section */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Bộ lọc tìm kiếm</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-white/60 mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Biển số xe
                </div>
                <Input
                  placeholder="VD: 29A-123.45"
                  value={licensePlate}
                  onChange={(e) => {
                    setPageNumber(0);
                    setLicensePlate(e.target.value);
                  }}
                  className="!bg-white/5 !border-white/10 !text-white"
                />
              </div>

              <div>
                <div className="text-sm text-white/60 mb-2">Trạng thái</div>
                <Select
                  allowClear
                  className="w-full"
                  placeholder="Tất cả"
                  value={status}
                  onChange={(value) => {
                    setPageNumber(0);
                    setStatus(value);
                  }}
                  options={[
                    { label: "Tất cả", value: undefined },
                    { label: "Đang đỗ (IN)", value: "IN" },
                    { label: "Đã rời bãi (OUT)", value: "OUT" },
                  ]}
                />
              </div>

              <div className="md:col-span-2">
                <div className="text-sm text-white/60 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Khoảng thời gian
                </div>
                <RangePicker
                  showTime
                  className="w-full"
                  format="DD/MM/YYYY HH:mm"
                  value={dateRange}
                  onChange={(values) => {
                    setPageNumber(0);
                    setDateRange(values || []);
                  }}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => fetchLogs(pageNumber, pageSize)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Làm mới
              </button>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <Table
              rowKey={(record, index) => `${record.licensePlate}-${index}`}
              columns={columns}
              dataSource={logs}
              loading={loading}
              pagination={{
                current: pageNumber + 1,
                pageSize,
                total: totalElements,
                showSizeChanger: true,
                onChange: (page, size) => {
                  setPageNumber(page - 1);
                  setPageSize(size);
                },
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} bản ghi`,
              }}
              className="dark-table"
            />
          </div>
        </main>
      </div>
    </ConfigProvider>
  );
}
