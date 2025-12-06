/**
 * Battle Schedule Management Page
 *
 * Superadmin page for managing the Master Battle schedule.
 * Includes next battle date configuration, manual battle creation,
 * and viewing the complete master schedule.
 */

import { Navigate } from 'react-router-dom';

import BattleScheduleManager from '../components/admin/BattleScheduleManager';
import { useAuth } from '../contexts/AuthContext';

export default function BattleSchedulePage() {
  const { user, isAuthenticated } = useAuth();

  // Check if user is superadmin
  if (!isAuthenticated || !user?.roles?.includes('superadmin')) {
    return <Navigate to="/" replace />;
  }

  return <BattleScheduleManager />;
}
