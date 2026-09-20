import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Marketplace: { category?: string; type?: string } | undefined;
  Chat: undefined;
  Wallet: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  // Main Tab Container
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;

  // Auth Screens
  Login: undefined;
  Register: undefined;

  // Detail & Hub Screens (100% feature match with web)
  ProductDetail: { slug: string; id?: string };
  ChatDetail: { conversationId?: string; targetUserId?: string; initialDealId?: string; partner?: any };
  Recharge: undefined;
  Withdraw: undefined;
  MyProducts: undefined;
  AddProduct: { destination?: string } | undefined;
  MoneyExchange: undefined;
  TransactionsHub: undefined;
  UsersSearch: undefined;
  Guides: undefined;
  GuideDetail: { guideId: string; slug?: string };
  DisputePolicy: undefined;
  Dashboard: undefined;
  MyBids: undefined;
  MyDisputes: undefined;
};
