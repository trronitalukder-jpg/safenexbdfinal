import React from 'react';
import { DashboardScreen } from '../dashboard/DashboardScreen';

/**
 * ProfileScreen renders the full 100% User Dashboard
 * ensuring that tapping the Profile tab or any profile link
 * immediately presents the complete command center with
 * wallet balances, commission calculator, withdraw, recharge, chat deals, and quick actions.
 */
export const ProfileScreen: React.FC = () => {
  return <DashboardScreen />;
};
