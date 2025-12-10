import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LoginScreen, RegisterScreen, RequestsScreen, NewRequestScreen, HistoryScreen, DashboardScreen, SupplierWelcomeScreen, SupplierEvaluationScreen, SupplierCreationScreen, QualityQuestionnaireScreen, SupplyQuestionnaireScreen, PhotoEvidenceScreen, ManagerDashboardScreen, ManagerRequestsScreen, RequestReviewScreen, SupplierDetailScreen, SupplierListScreen, SupplierInviteScreen, SupplierSearchScreen, SupplierTechnicalSheetScreen, AuditScreen, ManagerProfileScreen } from '../screens';
import { EPIConfigScreen } from '../screens/EPIConfigScreen';
import { RequestDetailScreen } from '../screens/RequestDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { User, UserRole } from '../types';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';

type Screen = 'Login' | 'Register' | 'Dashboard' | 'Requests' | 'NewRequest' | 'History' | 'RequestDetail' | 'Profile' | 'SupplierWelcome' | 'SupplierEvaluation' | 'SupplierCreation' | 'QualityQuestionnaire' | 'SupplyQuestionnaire' | 'PhotoEvidence' | 'ManagerDashboard' | 'ManagerRequests' | 'RequestReview' | 'SupplierDetail' | 'SupplierList' | 'SupplierInvite' | 'SupplierSearch' | 'SupplierTechnicalSheet' | 'Audit' | 'ManagerProfile' | 'EPIConfig';

/**
 * Navegación temporal simple con manejo de roles
 * Flujo: Login -> Pantalla según rol del usuario
 */
export const SimpleNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [requestsFilter, setRequestsFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [reviewRequestId, setReviewRequestId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null);
  // Estado para mostrar términos tras responsable EPI
  const [showTerms, setShowTerms] = React.useState(false);
  const navigateToEPIConfig = () => {
    setPreviousScreen(currentScreen);
    setCurrentScreen('EPIConfig');
  };

  const navigateToRegister = () => setCurrentScreen('Register');
  const navigateToLogin = () => {
    setCurrentScreen('Login');
    setCurrentUser(null);
  };

  const handleLogout = () => {
    setCurrentScreen('Login');
    setCurrentUser(null);
    setSelectedRequestId(null);
  };

  const navigateToNewRequest = () => setCurrentScreen('NewRequest');
  const navigateBackToRequests = () => setCurrentScreen('Requests');
  const navigateToHistory = () => setCurrentScreen('History');
  const navigateToRequestDetail = (requestId: string) => {
    setSelectedRequestId(requestId);
    setCurrentScreen('RequestDetail');
  };
  const navigateBackFromDetail = () => {
    setSelectedRequestId(null);
    setCurrentScreen('Requests');
  };
  const navigateToProfile = () => setCurrentScreen('Profile');
  const navigateBackFromProfile = () => setCurrentScreen('Requests');
  const navigateToSupplierEvaluation = () => setCurrentScreen('SupplierEvaluation');
  const navigateBackToSupplierWelcome = () => setCurrentScreen('SupplierWelcome');
  const navigateToSupplierCreation = () => setCurrentScreen('SupplierCreation');
  const navigateBackToSupplierEvaluation = () => setCurrentScreen('SupplierEvaluation');
  const navigateToQualityQuestionnaire = () => setCurrentScreen('QualityQuestionnaire');
  const navigateToSupplyQuestionnaire = () => setCurrentScreen('SupplyQuestionnaire');
  const navigateToPhotoEvidence = () => setCurrentScreen('PhotoEvidence');

  // Funciones de navegación para Manager
  const navigateToManagerRequests = (filter?: 'all' | 'pending' | 'completed') => {
    if (filter) setRequestsFilter(filter);
    setCurrentScreen('ManagerRequests');
  };
  const navigateBackToManagerDashboard = () => setCurrentScreen('ManagerDashboard');
  const navigateToRequestReview = (requestId: string) => {
    setReviewRequestId(requestId);
    setPreviousScreen(currentScreen); // Guardar pantalla actual antes de navegar
    setCurrentScreen('RequestReview');
  };
  const navigateBackToManagerRequests = () => setCurrentScreen('ManagerRequests');
  const navigateToSupplierDetail = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setPreviousScreen(currentScreen);
    setCurrentScreen('SupplierDetail');
  };
  const navigateToSupplierTechnicalSheet = () => {
    setCurrentScreen('SupplierTechnicalSheet');
  };
  const navigateToAudit = () => {
    setCurrentScreen('Audit');
  };
  const navigateBackToRequestReview = () => setCurrentScreen('RequestReview');
  const navigateToSupplierList = () => {
    if (currentUser && currentUser.role === UserRole.GESTOR) {
      setCurrentScreen('SupplierList');
    } else {
      // Opcional: mostrar alerta o ignorar
      // alert('Solo gestores pueden acceder a proveedores');
    }
  };
  const navigateToSupplierInvite = () => {
    setPreviousScreen(currentScreen);
    setCurrentScreen('SupplierInvite');
  };
  const navigateBackToSupplierList = () => setCurrentScreen('SupplierList');
  const navigateToSupplierSearch = () => setCurrentScreen('SupplierSearch');
  const navigateToManagerProfile = () => setCurrentScreen('ManagerProfile');

  const handleLogin = (user: User) => {
    setCurrentUser(user);

    // Redireccionar según el rol del usuario
    switch (user.role) {
      case UserRole.SOLICITANTE:
        setCurrentScreen('Requests');
        break;
      case UserRole.APROBADOR:
        // Por ahora va al dashboard, más tarde crearemos la pantalla de aprobador
        setCurrentScreen('Dashboard');
        break;
      case UserRole.GESTOR:
        setCurrentScreen('ManagerDashboard');
        break;
      case UserRole.PROVEEDOR:
        setCurrentScreen('SupplierWelcome');
        break;
      case UserRole.ADMIN:
        setCurrentScreen('Dashboard');
        break;
      default:
        setCurrentScreen('Requests');
    }
  };

  const handleContinueSupplierWelcome = () => setShowTerms(true);
  const handleAcceptTerms = () => {
    setShowTerms(false);
    setCurrentScreen('SupplierEvaluation');
  };
  const handleRejectTerms = () => {
    setShowTerms(false);
    setCurrentScreen('Login');
    setCurrentUser(null);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Login':
        return (
          <LoginScreen
            onNavigateToRegister={navigateToRegister}
            onLogin={handleLogin}
          />
        );
      case 'Register':
        return (
          <RegisterScreen
            onNavigateToLogin={navigateToLogin}
            onRegister={handleLogin}
          />
        );
      case 'Requests':
        return (
          <RequestsScreen
            onNavigateToNewRequest={navigateToNewRequest}
            onNavigateToHistory={navigateToHistory}
            onNavigateToDetail={navigateToRequestDetail}
            onNavigateToProfile={navigateToProfile}
          />
        );
      case 'NewRequest':
        return <NewRequestScreen onNavigateBack={navigateBackToRequests} />;
      case 'History':
        return (
          <HistoryScreen
            onNavigateToRequests={navigateBackToRequests}
            onNavigateToNewRequest={navigateToNewRequest}
            onNavigateToProfile={navigateToProfile}
            onNavigateToDetail={navigateToRequestDetail}
          />
        );
      case 'RequestDetail':
        return (
          <RequestDetailScreen
            onNavigateBack={navigateBackFromDetail}
            requestId={selectedRequestId || undefined}
          />
        );
      case 'Profile':
        return (
          <ProfileScreen
            onNavigateBack={navigateBackFromProfile}
            onNavigateToNewRequest={navigateToNewRequest}
            onNavigateToHistory={navigateToHistory}
            onNavigateToRequests={navigateBackToRequests}
            onLogout={handleLogout}
          />
        );
      case 'SupplierWelcome':
        return showTerms ? (
          <TermsConditionsScreen onAccept={handleAcceptTerms} onReject={handleRejectTerms} />
        ) : (
          <SupplierWelcomeScreen
            onContinueToEvaluation={handleContinueSupplierWelcome}
          />
        );
      case 'SupplierEvaluation':
        return (
          <SupplierEvaluationScreen
            onNavigateBack={navigateBackToSupplierWelcome}
            onNavigateToCreation={navigateToSupplierCreation}
            onNavigateToQuestionnaireQuality={navigateToQualityQuestionnaire}
            onNavigateToQuestionnaireSupply={navigateToSupplyQuestionnaire}
            onNavigateToPhotoEvidence={navigateToPhotoEvidence}
            onSignOut={handleLogout}
          />
        );
      case 'SupplierCreation':
        return (
          <SupplierCreationScreen
            onNavigateBack={navigateBackToSupplierEvaluation}
            onComplete={navigateBackToSupplierEvaluation}
          />
        );
      case 'QualityQuestionnaire':
        return (
          <QualityQuestionnaireScreen
            onNavigateBack={navigateBackToSupplierEvaluation}
            onComplete={navigateBackToSupplierEvaluation}
            onNavigateToSupplyQuestionnaire={navigateToSupplyQuestionnaire}
          />
        );
      case 'SupplyQuestionnaire':
        return (
          <SupplyQuestionnaireScreen
            onNavigateBack={navigateToQualityQuestionnaire}
            onComplete={navigateBackToSupplierEvaluation}
            onNavigateToPhotoEvidence={navigateToPhotoEvidence}
          />
        );
      case 'PhotoEvidence':
        return (
          <PhotoEvidenceScreen
            onNavigateBack={navigateToSupplyQuestionnaire}
            onComplete={navigateBackToSupplierEvaluation}
          />
        );
      case 'ManagerDashboard':
        return (
          <ManagerDashboardScreen
            onNavigateToRequests={navigateToManagerRequests}
            onNavigateToSuppliers={navigateToSupplierList}
            onNavigateToProfile={navigateToManagerProfile}
            onNavigateToValidateRequest={navigateToRequestReview}
          />
        );
      case 'ManagerRequests':
        return (
          <ManagerRequestsScreen
            onNavigateBack={navigateBackToManagerDashboard}
            onNavigateToDashboard={navigateBackToManagerDashboard}
            onNavigateToProveedores={navigateToSupplierList}
            onNavigateToReview={navigateToRequestReview}
            onNavigateToProfile={navigateToManagerProfile}
            initialFilter={requestsFilter}
          />
        );
      case 'RequestReview':
        return (
          <RequestReviewScreen
            requestId={reviewRequestId || undefined}
            onNavigateBack={() => {
              // Regresar a la pantalla anterior (Dashboard o Requests)
              if (previousScreen) {
                setCurrentScreen(previousScreen);
                setPreviousScreen(null);
              } else {
                setCurrentScreen('ManagerRequests'); // Fallback
              }
            }}
            onNavigateToDashboard={navigateBackToManagerDashboard}
            onNavigateToProveedores={() => setCurrentScreen('SupplierSearch')}
            onNavigateToSupplierDetail={navigateToSupplierDetail}
            onApprove={(requestId, comment) => {
              setCurrentScreen('SupplierSearch');
            }}
            onReject={(requestId, comment) => {
              // Al rechazar, regresar a la pantalla anterior
              if (previousScreen) {
                setCurrentScreen(previousScreen);
                setPreviousScreen(null);
              } else {
                setCurrentScreen('ManagerRequests'); // Fallback
              }
            }}
          />
        );
      case 'SupplierList':
        if (!currentUser || currentUser.role !== UserRole.GESTOR) {
          return <LoginScreen onNavigateToRegister={navigateToRegister} onLogin={handleLogin} />;
        }
        return (
          <SupplierListScreen
            onNavigateToDashboard={navigateBackToManagerDashboard}
            onNavigateToRequests={() => navigateToManagerRequests('all')}
            onNavigateToProfile={navigateToManagerProfile}
            onNavigateToInvite={navigateToSupplierInvite}
            onNavigateToDetail={navigateToSupplierDetail}
          />
        );
      case 'SupplierInvite':
        return (
          <SupplierInviteScreen
            onNavigateBack={() => {
              if (previousScreen) {
                setCurrentScreen(previousScreen);
                setPreviousScreen(null);
              } else {
                setCurrentScreen('SupplierSearch');
              }
            }}
            onInviteSent={navigateToSupplierSearch}
          />
        );
      case 'SupplierSearch':
        return (
          <SupplierSearchScreen
            onNavigateBack={navigateBackToRequestReview}
            onContinueToQuotation={() => console.log('Continuar a cotización')}
            onNavigateToDetail={navigateToSupplierDetail}
            onNavigateToInvite={navigateToSupplierInvite}
          />
        );
      case 'SupplierDetail':
        return (
          <SupplierDetailScreen
            supplierId={selectedSupplierId || undefined}
            onNavigateBack={() => {
              // Regresar a la pantalla anterior
              if (previousScreen) {
                setCurrentScreen(previousScreen);
                setPreviousScreen(null);
              } else {
                setCurrentScreen('SupplierSearch');
              }
            }}
            onApprove={(supplierId) => {
              console.log('Aprobar proveedor:', supplierId);
              setCurrentScreen('SupplierList');
            }}
            onReject={(supplierId) => {
              console.log('Rechazar proveedor:', supplierId);
              setCurrentScreen('SupplierList');
            }}
            onNavigateToEdit={navigateToSupplierTechnicalSheet}
            onNavigateToAudit={navigateToAudit}
          />
        );
      case 'SupplierTechnicalSheet':
        return (
          <SupplierTechnicalSheetScreen
            supplierId={selectedSupplierId || ''}
            onNavigateBack={() => setCurrentScreen('SupplierDetail')}
          />
        );
      case 'Audit':
        return (
          <AuditScreen
            supplierId={selectedSupplierId || ''}
            onNavigateBack={() => setCurrentScreen('SupplierDetail')}
          />
        );
      case 'ManagerProfile':
        return (
          <ManagerProfileScreen
            onNavigateBack={navigateBackToManagerDashboard}
            onNavigateToDashboard={navigateBackToManagerDashboard}
            onNavigateToRequests={navigateToManagerRequests}
            onNavigateToSuppliers={navigateToSupplierList}
            onNavigateToEPIConfig={navigateToEPIConfig}
            onLogout={handleLogout}
          />
        );
      case 'EPIConfig':
        return (
          <EPIConfigScreen
            onNavigateBack={() => {
              if (previousScreen) {
                setCurrentScreen(previousScreen);
                setPreviousScreen(null);
              } else {
                setCurrentScreen('ManagerDashboard');
              }
            }}
          />
        );
      case 'Dashboard':
        return <DashboardScreen />;
      default:
        return (
          <LoginScreen
            onNavigateToRegister={navigateToRegister}
            onLogin={handleLogin}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});