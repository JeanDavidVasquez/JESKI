import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { AuthService } from '../services';
import { LoginScreen, RegisterScreen, RequestsScreen, NewRequestScreen, HistoryScreen, DashboardScreen, SupplierWelcomeScreen, SupplierEvaluationScreen, SupplierCreationScreen, QualityQuestionnaireScreen, SupplyQuestionnaireScreen, PhotoEvidenceScreen, ManagerDashboardScreen, ManagerRequestsScreen, RequestReviewScreen, SupplierDetailScreen, SupplierListScreen, SupplierInviteScreen, SupplierSearchScreen, SupplierTechnicalSheetScreen, AuditScreen, ManagerProfileScreen } from '../screens';
import { EPIConfigScreen } from '../screens/EPIConfigScreen';
import { EPIPendingListScreen } from '../screens/EPIPendingListScreen'; // NEW
import { EPIAuditScreen } from '../screens/EPIAuditScreen';
import { UserManagementScreen } from '../screens/UserManagementScreen';
import { RequestDetailScreen } from '../screens/RequestDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SolicitanteDashboardScreen } from '../screens/SolicitanteDashboardScreen';
import { SolicitanteHistoryScreen } from '../screens/SolicitanteHistoryScreen';
import { SolicitanteProfileScreen } from '../screens/SolicitanteProfileScreen';
import { User, UserRole, Request } from '../types';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';

export type Screen =
  | 'Login'
  | 'Register'
  | 'Dashboard'
  | 'Requests'
  | 'NewRequest'
  | 'History'
  | 'RequestDetail'
  | 'Profile'
  | 'SupplierWelcome'
  | 'SupplierEvaluation'
  | 'SupplierCreation'
  | 'QualityQuestionnaire'
  | 'SupplyQuestionnaire'
  | 'PhotoEvidence'
  | 'ManagerDashboard'
  | 'ManagerRequests'
  | 'RequestReview'
  | 'SupplierDetail'
  | 'SupplierList'
  | 'SupplierInvite'
  | 'SupplierSearch'
  | 'SupplierTechnicalSheet'
  | 'Audit'
  | 'ManagerProfile'
  | 'EPIConfig'
  | 'UserManagement'
  | 'SolicitanteDashboard'
  | 'SolicitanteHistory'
  | 'SolicitanteProfile'
  | 'ManagerSuppliers'
  | 'PendingApproval'
  | 'ValidateRequest'
  | 'EPIPendingList' // NEW
  | 'EPIAudit'; // NEW

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
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);

  // NEW: EPI Audit states
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [auditSupplierId, setAuditSupplierId] = useState<string | null>(null);

  // Estado para mostrar términos tras responsable EPI
  const [showTerms, setShowTerms] = useState(false);
  const [epiResponsableData, setEpiResponsableData] = useState<{ fullName: string; email: string; position: string } | null>(null);

  const logEpiSession = async (responsableData: { fullName: string; email: string; position: string }) => {
    if (!currentUser) return;
    try {
      // Guardar en sub-colección 'contacts' del usuario
      await addDoc(collection(db, 'users', currentUser.id, 'contacts'), {
        userId: currentUser.id,
        userEmail: currentUser.email,
        companyName: currentUser.companyName || currentUser.firstName,
        responsableName: responsableData.fullName,
        responsableEmail: responsableData.email,
        responsablePosition: responsableData.position,
        termsAccepted: true,
        loginTime: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      console.log('EPI Session Logged');
    } catch (error) {
      console.error('Error logging EPI session:', error);
    }
  };

  const handleContinueSupplierWelcome = async (data: { fullName: string; email: string; position: string }) => {
    setEpiResponsableData(data);

    // Check if user already accepted terms
    if (currentUser?.termsAccepted) {
      await logEpiSession(data);
      setCurrentScreen('SupplierEvaluation');
    } else {
      setShowTerms(true);
    }
  };

  const handleAcceptTerms = async () => {
    if (currentUser && epiResponsableData) {
      await logEpiSession(epiResponsableData);

      // Update User Profile to prevent showing terms again
      try {
        const userRef = doc(db, 'users', currentUser.id);
        await updateDoc(userRef, {
          termsAccepted: true,
          updatedAt: serverTimestamp()
        });
        // Update local state to reflect change (optional but good practice)
        setCurrentUser({ ...currentUser, termsAccepted: true });
      } catch (error) {
        console.error('Error updating user terms acceptance:', error);
      }
    }
    setShowTerms(false);
    setCurrentScreen('SupplierEvaluation');
  };

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
    try {
      // Sign out from Firebase
      // We import dynamically or use the imported service
      // Assuming AuthService is imported
      AuthService.signOut();
    } catch (e) {
      console.error("Logout error", e);
    }
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
  const navigateToUserManagement = () => {
    setPreviousScreen('ManagerDashboard');
    setCurrentScreen('UserManagement');
  };

  // NEW: EPI Audit navigation handlers
  const navigateToEPIPendingList = () => {
    setPreviousScreen(currentScreen);
    setCurrentScreen('EPIPendingList');
  };

  const navigateToEPIAudit = (subId: string, suppId: string) => {
    setSubmissionId(subId);
    setAuditSupplierId(suppId);
    setPreviousScreen('EPIPendingList');
    setCurrentScreen('EPIAudit');
  };

  const handleNavigateToRequestDetail = (requestId: string) => {
    setSelectedRequestId(requestId);
    setCurrentScreen('RequestDetail');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    console.log('User logged in:', user.email, 'Role:', user.role);

    // Redireccionar según el rol del usuario (Normalized)
    const role = (user.role || '').toLowerCase();

    if (role === 'proveedor') {
      setCurrentScreen('SupplierWelcome');
      return;
    }

    if (role === 'gestor') {
      setCurrentScreen('ManagerDashboard');
      return;
    }

    if (role === 'admin') {
      setCurrentScreen('Dashboard');
      return;
    }

    if (role === 'aprobador') {
      setCurrentScreen('Dashboard');
      return;
    }

    // For SOLICITANTE: check approval status and route to Dashboard
    if (role === 'solicitante') {
      if (user.approved === false) {
        alert('Tu cuenta está pendiente de aprobación por un gestor. Serás notificado cuando puedas acceder.');
        setCurrentScreen('Login');
        setCurrentUser(null);
        return;
      }
      // Approved or no approval field (legacy users) - go to Dashboard
      setCurrentScreen('SolicitanteDashboard');
      return;
    }

    // Default fallback
    setCurrentScreen('Requests');
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
      case 'ValidateRequest':
        return (
          <LoginScreen
            onNavigateToRegister={navigateToRegister}
            onLogin={handleLogin}
          />
        ); // TODO: Implement ValidateRequestScreen or map correctly





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
        return (
          <NewRequestScreen
            initialRequest={editingRequest}
            onNavigateBack={() => {
              setEditingRequest(null);
              if (currentUser?.role === UserRole.SOLICITANTE) {
                setCurrentScreen('SolicitanteDashboard');
              } else {
                navigateBackToRequests();
              }
            }}
            onNavigateToDashboard={() => {
              setEditingRequest(null);
              setCurrentScreen('SolicitanteDashboard');
            }}
            onNavigateToNewRequest={() => { }}
            onNavigateToHistory={() => {
              setEditingRequest(null);
              setCurrentScreen('SolicitanteHistory');
            }}
            onNavigateToProfile={() => {
              setEditingRequest(null);
              setCurrentScreen('SolicitanteProfile');
            }}
          />
        );
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
            requestId={selectedRequestId!}
            onBack={() => {
              if (currentUser?.role === UserRole.SOLICITANTE) {
                setCurrentScreen('SolicitanteDashboard');
              } else {
                navigateBackFromDetail();
              }
            }}
            onNavigateToEdit={(request) => {
              setEditingRequest(request);
              setCurrentScreen('NewRequest');
            }}
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

      // SOLICITANTE Screens
      case 'SolicitanteDashboard':
        return (
          <SolicitanteDashboardScreen
            onNavigateToNewRequest={() => setCurrentScreen('NewRequest')}
            onNavigateToHistory={() => setCurrentScreen('SolicitanteHistory')}
            onNavigateToProfile={() => setCurrentScreen('SolicitanteProfile')}
            onNavigateToRequestDetail={handleNavigateToRequestDetail}
          />
        );
      case 'SolicitanteHistory':
        return (
          <SolicitanteHistoryScreen
            onNavigateToDashboard={() => setCurrentScreen('SolicitanteDashboard')}
            onNavigateToNewRequest={() => { setEditingRequest(null); setCurrentScreen('NewRequest'); }}
            onNavigateToProfile={() => setCurrentScreen('SolicitanteProfile')}
            onNavigateToRequestDetail={handleNavigateToRequestDetail}
          />
        );

      case 'SolicitanteProfile':
        return (
          <SolicitanteProfileScreen
            onNavigateToDashboard={() => setCurrentScreen('SolicitanteDashboard')}
            onNavigateToNewRequest={() => setCurrentScreen('NewRequest')}
            onNavigateToHistory={() => setCurrentScreen('SolicitanteHistory')}
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
            user={currentUser}
          />
        );
      case 'SupplierCreation':
        return (
          <SupplierCreationScreen
            onNavigateBack={navigateBackToSupplierEvaluation}
            onComplete={navigateBackToSupplierEvaluation}
            user={currentUser}
          />
        );
      case 'QualityQuestionnaire':
        return (
          <QualityQuestionnaireScreen
            supplierId={selectedSupplierId || currentUser?.id || ''}
            onNavigateBack={navigateBackToSupplierEvaluation}
            onComplete={navigateBackToSupplierEvaluation}
            onNavigateToSupplyQuestionnaire={navigateToSupplyQuestionnaire}
          />
        );
      case 'SupplyQuestionnaire':
        return (
          <SupplyQuestionnaireScreen
            supplierId={selectedSupplierId || currentUser?.id || ''}
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
            supplierId={currentUser?.id}
          />
        );
      case 'EPIPendingList':
        if (!currentUser || currentUser.role !== UserRole.GESTOR) {
          return <LoginScreen onNavigateToRegister={navigateToRegister} onLogin={handleLogin} />;
        }
        return (
          <EPIPendingListScreen
            onNavigateBack={() => {
              if (previousScreen) {
                setCurrentScreen(previousScreen);
                setPreviousScreen(null);
              } else {
                setCurrentScreen('ManagerDashboard');
              }
            }}
            onNavigateToAudit={(subId, suppId) => navigateToSupplierDetail(suppId)}
          />
        );

      case 'EPIAudit':
        return (
          <EPIAuditScreen
            submissionId={submissionId}
            supplierId={auditSupplierId}
            gestorId={currentUser.id}
            onNavigateBack={() => {
              if (previousScreen) {
                setCurrentScreen(previousScreen);
                setPreviousScreen(null);
              } else {
                setCurrentScreen('EPIPendingList');
              }
            }}
            onApproved={() => {
              setSubmissionId(null);
              setAuditSupplierId(null);
              setCurrentScreen('EPIPendingList');
            }}
          />
        );

      case 'ManagerDashboard':
        return (
          <ManagerDashboardScreen
            onNavigateToRequests={navigateToManagerRequests}
            onNavigateToSuppliers={navigateToSupplierList}
            onNavigateToProfile={navigateToManagerProfile}
            onNavigateToValidateRequest={navigateToRequestReview}
            onNavigateToSearch={(requestId) => {
              setReviewRequestId(requestId);
              setPreviousScreen('ManagerDashboard'); // Set previous screen for correct back navigation
              setCurrentScreen('SupplierSearch');
            }}
            onNavigateToUserManagement={navigateToUserManagement}
            onNavigateToEPIPendingList={navigateToEPIPendingList} // NEW
          />
        );
      case 'ManagerRequests':
        return (
          <ManagerRequestsScreen
            onNavigateBack={navigateBackToManagerDashboard}
            onNavigateToDashboard={navigateBackToManagerDashboard}
            onNavigateToProveedores={navigateToSupplierList}
            onNavigateToSearch={(requestId) => {
              setReviewRequestId(requestId);
              setPreviousScreen('ManagerRequests'); // Ensure we can go back
              setCurrentScreen('SupplierSearch');
            }}
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
            onNavigateToProveedores={(requestId) => {
              setReviewRequestId(requestId); // Store requestId for filtering
              setPreviousScreen('RequestReview');
              setCurrentScreen('SupplierSearch');
            }}
            onNavigateToSupplierDetail={navigateToSupplierDetail}
            currentUser={currentUser}
            onApprove={(requestId, comment) => {
              setPreviousScreen('RequestReview');
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
            requestId={reviewRequestId || undefined}
            onNavigateBack={() => {
              // Go to RequestReview but DON'T change previousScreen
              // This way, RequestReview can still go back to the original screen (Dashboard/Requests)
              setCurrentScreen('RequestReview');
            }}
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
                setCurrentScreen('SupplierList');
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
            onNavigateToAudit={(subId) => {
              if (subId) {
                setSubmissionId(subId);
                // Use selectedSupplierId if available, otherwise assume we are in the correct context
                setAuditSupplierId(selectedSupplierId || '');
                setPreviousScreen('SupplierDetail');
                setCurrentScreen('EPIAudit');
              } else {
                console.warn('Cannot navigate to audit: missing submission ID');
              }
            }}
          />
        );
      case 'SupplierTechnicalSheet':
        return (
          <SupplierTechnicalSheetScreen
            supplierId={selectedSupplierId || ''}
            onNavigateBack={() => setCurrentScreen('SupplierDetail')}
          />
        );
      case 'EPIPendingList':
        return (
          <EPIPendingListScreen
            onNavigateBack={() => {
              if (previousScreen) {
                setCurrentScreen(previousScreen);
                setPreviousScreen(null);
              } else {
                setCurrentScreen('ManagerDashboard');
              }
            }}
            onNavigateToAudit={(subId, suppId) => {
              setSubmissionId(subId);
              setAuditSupplierId(suppId);
              setPreviousScreen('EPIPendingList');
              setCurrentScreen('EPIAudit');
            }}
          />
        );
      case 'EPIAudit':
        return (
          <EPIAuditScreen
            submissionId={submissionId || ''}
            supplierId={auditSupplierId || ''}
            gestorId={currentUser?.id || 'admin'}
            onNavigateBack={() => {
              if (previousScreen) {
                setCurrentScreen(previousScreen);
                setPreviousScreen(null);
              } else {
                setCurrentScreen('EPIPendingList');
              }
            }}
            onApproved={() => {
              setCurrentScreen('EPIPendingList');
            }}
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
            onNavigateToUserManagement={navigateToUserManagement}
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
            onNavigateToProfile={() => setCurrentScreen('ManagerProfile')}
          />
        );
      case 'UserManagement':
        return (
          <UserManagementScreen
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