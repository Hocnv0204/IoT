import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { authService } from '../services/authService';

export default function Index() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();
    if (isAuthenticated) {
      navigate({ to: '/dashboard', replace: true });
    } else {
      navigate({ to: '/login', replace: true });
    }
  }, [navigate]);
  
  return <div className="min-h-screen flex items-center justify-center">
    <div className="text-gray-500">Đang chuyển hướng...</div>
  </div>;
}
