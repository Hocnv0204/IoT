import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { authService } from '../services/authService';

export default function Dashboard() {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login', replace: true });
    }
  }, [navigate, isAuthenticated]);
  
  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">Đang chuyển hướng...</div>
    </div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Dashboard
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Chào mừng bạn đến với hệ thống quản lý bãi đỗ xe!
          </p>
        </div>
      </div>
    </div>
  );
}

