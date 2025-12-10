/**
 * Tipos de navegación para React Navigation
 */

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  SupplierList: undefined;
  SupplierDetail: { supplierId: string };
  SupplierForm: { supplierId?: string };
  Profile: undefined;
};

export type TabParamList = {
  DashboardTab: undefined;
  SuppliersTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};