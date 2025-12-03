import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { DatePicker, Select, Input, Table, Tag } from "antd";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <span className="bg-yellow-100 border px-3 py-1 rounded font-mono font-semibold">
          {plate}
        </span>
      ),
    },
    {
      title: "Chủ xe",
      dataIndex: "ownerName",
      key: "ownerName",
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
      render: (value) =>
        value ? new Date(value).toLocaleString("vi-VN") : "-",
    },
    {
      title: "Thời gian ra",
      dataIndex: "timeOut",
      key: "timeOut",
      render: (value) =>
        value ? new Date(value).toLocaleString("vi-VN") : "-",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Lịch sử ra vào bãi đỗ xe
            </h1>
            <p className="text-gray-500">
              Tra cứu chi tiết các lượt xe vào/ra theo thời gian, biển số và
              trạng thái.
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Quay về Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Biển số xe</div>
              <Input
                placeholder="VD: 29A-123.45"
                value={licensePlate}
                onChange={(e) => {
                  setPageNumber(0);
                  setLicensePlate(e.target.value);
                }}
              />
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Trạng thái</div>
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
              <div className="text-sm text-gray-600 mb-1">Khoảng thời gian</div>
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
        </div>

        <div className="bg-white rounded-lg shadow p-4">
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
          />
        </div>
      </div>
    </div>
  );
}


