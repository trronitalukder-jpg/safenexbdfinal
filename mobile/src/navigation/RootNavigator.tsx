import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AppTabs } from './AppTabs';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ProductDetailScreen } from '../screens/marketplace/ProductDetailScreen';
import { ChatDetailScreen } from '../screens/chat/ChatDetailScreen';
import { RechargeScreen } from '../screens/wallet/RechargeScreen';
import { WithdrawScreen } from '../screens/wallet/WithdrawScreen';
import { MyProductsScreen } from '../screens/profile/MyProductsScreen';
import { AddProductScreen } from '../screens/profile/AddProductScreen';
import { MoneyExchangeScreen } from '../screens/marketplace/MoneyExchangeScreen';
import { TransactionsScreen } from '../screens/transactions/TransactionsScreen';
import { UsersSearchScreen } from '../screens/users/UsersSearchScreen';
import { GuidesScreen } from '../screens/guides/GuidesScreen';
import { GuideDetailScreen } from '../screens/guides/GuideDetailScreen';
import { DisputePolicyScreen } from '../screens/guides/DisputePolicyScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { MyBidsScreen } from '../screens/bids/MyBidsScreen';
import { MyDisputesScreen } from '../screens/disputes/MyDisputesScreen';
import { useThemeStore } from '../store/useThemeStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { colors } = useThemeStore();

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      {/* Primary Tab Hub */}
      <Stack.Screen name="MainTabs" component={AppTabs} />

      {/* Auth Screens */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ animation: 'slide_from_bottom' }}
      />

      {/* Marketplace & Chat Detail */}
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />

      {/* Wallet Operations */}
      <Stack.Screen name="Recharge" component={RechargeScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawScreen} />

      {/* Seller Management */}
      <Stack.Screen name="MyProducts" component={MyProductsScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />

      {/* Hubs & Feature Screens */}
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="MoneyExchange" component={MoneyExchangeScreen} />
      <Stack.Screen name="TransactionsHub" component={TransactionsScreen} />
      <Stack.Screen name="UsersSearch" component={UsersSearchScreen} />
      <Stack.Screen name="Guides" component={GuidesScreen} />
      <Stack.Screen name="GuideDetail" component={GuideDetailScreen} />
      <Stack.Screen name="DisputePolicy" component={DisputePolicyScreen} />
      <Stack.Screen name="MyBids" component={MyBidsScreen} />
      <Stack.Screen name="MyDisputes" component={MyDisputesScreen} />
    </Stack.Navigator>
  );
};
