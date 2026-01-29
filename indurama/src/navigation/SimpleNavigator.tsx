import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { AuthService } from '../services';

// Consolidated imports from role-based modules
import {
  // Shared
  LoginScreen,
  RegisterScreen,
  TermsConditionsScreen,
  NotificationsScreen,
  ProfileScreen,
  // Solicitante
  SolicitanteDashboardScreen,
  SolicitanteHistoryScreen,
  SolicitanteProfileScreen,
  SolicitanteNotificationsScreen,
  NewRequestScreen,
  RequestsScreen,
  RequestDetailScreen,
  HistoryScreen,
  // Gestor
  ManagerDashboardScreen,
  ManagerRequestsScreen,
  ManagerProfileScreen,
  ManagerNotificationsScreen,
  RequestReviewScreen,
  QuotationInviteScreen,
  QuotationCompareScreen,
  PurchaseOrderScreen,
  PaymentScreen,
  SupplierListScreen,
  SupplierDetailScreen,
  SupplierSearchScreen,
  SupplierInviteScreen,
  EPIConfigScreen,
  EPIPendingListScreen,
  EPIAuditScreen,
  UserManagementScreen,
  DashboardScreen,
  // Proveedor
  SupplierWelcomeScreen,
  SupplierDashboardScreen,
  SupplierProfileScreen,
  SupplierCreationScreen,
  SupplierEvaluationScreen,
  SupplierTechnicalSheetScreen,
  QualityQuestionnaireScreen,
  SupplyQuestionnaireScreen,
  PhotoEvidenceScreen,
  AuditScreen,
  ProviderQuotationsScreen,
  QuotationFormScreen,
  SupplierNotificationsScreen,
} from '../screens';
import { User, UserRole, Request } from '../types';


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
  | 'EPIPendingList'
  | 'EPIAudit'
  | 'QuotationInvite'
  | 'ProviderQuotations'
  | 'QuotationForm'
  | 'QuotationCompare'
  | 'Notifications'
  | 'SupplierDashboard'
  | 'QuotationCompare'
  | 'Notifications'
  | 'SupplierDashboard'
  | 'SupplierProfile'
  | 'PurchaseOrder'
  | 'Payment';

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

  // EPI Audit states
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [auditSupplierId, setAuditSupplierId] = useState<string | null>(null);

  // Quotation states
  const [quotationInvitationId, setQuotationInvitationId] = useState<string | null>(null);
  const [quotationRequestId, setQuotationRequestId] = useState<string | null>(null);
  const [selectedSupplierIdsForInvite, setSelectedSupplierIdsForInvite] = useState<string[]>([]);
  const [purchaseOrderData, setPurchaseOrderData] = useState<{ requestId: string, quotationId: string } | null>(null);
  const [paymentRequestId, setPaymentRequestId] = useState<string | null>(null);

  // Estado para mostrar términos tras responsable EPI
  const [showTerms, setShowTerms] = useState(false);
  const [epiResponsableData, setEpiResponsableData] = useState<{ fullName: string; email: string; position: string } | null>(null);

  const logEpiSession = async (responsableData: { fullName: string; email: string; position: string }) => {
    if (!currentUser) return;
    try {
      // 1. Guardar en sub-colección 'contacts' del usuario (Log histórico)
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

      // 2. Actualizar documento del proveedor para pre-carga en formulario EPI
      const supplierRef = doc(db, 'suppliers', currentUser.id);
      await updateDoc(supplierRef, {
        'general.legalRepresentative': responsableData.fullName,
        'general.contactPersonEmail': responsableData.email,
        'general.contactPersonPosition': responsableData.position,
        // Guardamos también las versiones planas por seguridad
        responsableEpiName: responsableData.fullName,
        responsableEpiEmail: responsableData.email,
        responsableEpiPosition: responsableData.position,
        responsableEpiTimestamp: serverTimestamp()
      });

      console.log('EPI Session Logged & Supplier Data Updated');
    } catch (error) {
      console.error('Error logging EPI session:', error);
    }
  };

  const handleContinueSupplierWelcome = async (data: { fullName: string; email: string; position: string }) => {
    setEpiResponsableData(data);
    // Terms are accepted at registration, proceed directly
    await logEpiSession(data);
    setCurrentScreen('SupplierEvaluation');
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

  // Quotation navigation handlers
  const navigateToQuotationInvite = (requestId: string) => {
    setQuotationRequestId(requestId);
    setPreviousScreen(currentScreen);
    setCurrentScreen('QuotationInvite');
  };

  const navigateToQuotationCompare = (requestId: string) => {
    setQuotationRequestId(requestId);
    setPreviousScreen(currentScreen);
    setCurrentScreen('QuotationCompare');
  };

  const navigateToProviderQuotations = () => {
    setPreviousScreen(currentScreen);
    setCurrentScreen('ProviderQuotations');
  };

  const navigateToNotifications = () => {
    console.log('navigateToNotifications called, currentScreen:', currentScreen);
    setPreviousScreen(currentScreen);
    setCurrentScreen('Notifications');
  };

  const navigateToPurchaseOrder = (requestId: string, quotationId: string) => {
    setPurchaseOrderData({ requestId, quotationId });
    setPreviousScreen(currentScreen);
    setCurrentScreen('PurchaseOrder');
  };

  const navigateToPayment = (requestId: string) => {
    setPaymentRequestId(requestId);
    setPreviousScreen(currentScreen);
    setCurrentScreen('Payment');
  };

  const handleNavigateToRequestDetail = (requestId: string) => {
    setSelectedRequestId(requestId);
    setCurrentScreen('RequestDetail');
  };

  const handleLogin = (user: User, targetRoute?: string) => {
    setCurrentUser(user);
    console.log('User logged in:', user.email, 'Role:', user.role);

    if (targetRoute) {
      setCurrentScreen(targetRoute as Screen);
      return;
    }

    // Redireccionar según el rol del usuario (Normalized)
    const role = (user.role || '').toLowerCase();

    if (role === 'proveedor') {
      // Logic now handled by LoginScreen via targetRoute, but keep fallback just in case
      // Verificar si completó EPI (Legacy local check)
      const hasCompletedEPI = user.supplierStatus === 'epi_approved' || user.supplierStatus === 'active';
      if (hasCompletedEPI) {
        setCurrentScreen('SupplierDashboard');
      } else {
        setCurrentScreen('SupplierWelcome');
      }
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
            user={currentUser ?? undefined}
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
            onNavigateToNotifications={navigateToNotifications}
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

      case 'SupplierDashboard':
        return (
          <SupplierDashboardScreen
            onNavigateToQuotations={navigateToProviderQuotations}
            onNavigateToProfile={() => setCurrentScreen('SupplierProfile')}
            onNavigateToNotifications={navigateToNotifications}
            onNavigateToEPIStatus={() => setCurrentScreen('SupplierEvaluation')}
            onLogout={handleLogout}
            user={currentUser}
          />
        );

      case 'SupplierProfile':
        return (
          <SupplierProfileScreen
            onNavigateBack={() => setCurrentScreen('SupplierDashboard')}
            onNavigateToEPIStatus={() => setCurrentScreen('SupplierEvaluation')}
            onNavigateToDashboard={() => setCurrentScreen('SupplierDashboard')}
            onNavigateToQuotations={navigateToProviderQuotations}
            onLogout={handleLogout}
          />
        );

      case 'SupplierWelcome':
        return (
          <>
            <SupplierWelcomeScreen
              onNavigateToDashboard={handleContinueSupplierWelcome}
            />
            <TermsConditionsScreen
              visible={showTerms}
              mandatory={true}
              onAccept={handleAcceptTerms}
              onReject={handleRejectTerms}
            />
          </>
        );
      case 'SupplierEvaluation':
        return (
          <SupplierEvaluationScreen
            onNavigateBack={navigateBackToSupplierWelcome}
            onNavigateToCreation={navigateToSupplierCreation}
            onNavigateToQuestionnaireQuality={navigateToQualityQuestionnaire}
            onNavigateToQuestionnaireSupply={navigateToSupplyQuestionnaire}
            onNavigateToPhotoEvidence={navigateToPhotoEvidence}
            onNavigateToDashboard={() => setCurrentScreen('SupplierDashboard')}
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
              setCurrentScreen('ManagerDashboard');
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
            onNavigateToEPIPendingList={navigateToEPIPendingList}
            onNavigateToQuotationCompare={(requestId: string) => {
              setQuotationRequestId(requestId);
              setPreviousScreen('ManagerDashboard');
              setCurrentScreen('QuotationCompare');
            }}
            onNavigateToPayment={navigateToPayment}
            onNavigateToNotifications={navigateToNotifications}
            currentUserOverride={currentUser} // Pass robust user session
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
            onNavigateToQuotationCompare={(requestId: string) => {
              setQuotationRequestId(requestId);
              setPreviousScreen('ManagerRequests');
              setCurrentScreen('QuotationCompare');
            }}
            onNavigateToPayment={navigateToPayment}
            initialFilter={requestsFilter}
            onNavigateToNotifications={navigateToNotifications}
          />
        );
      case 'PurchaseOrder':
        return (
          <PurchaseOrderScreen
            requestId={purchaseOrderData?.requestId || ''}
            quotationId={purchaseOrderData?.quotationId || ''}
            onBack={() => {
              if (previousScreen) {
                setCurrentScreen(previousScreen);
                setPreviousScreen(null);
              } else {
                setCurrentScreen('QuotationCompare');
              }
            }}
            onNavigateToRegisterPayment={() => navigateToPayment(purchaseOrderData?.requestId || '')}
          />
        );
      case 'Payment':
        return (
          <PaymentScreen
            requestId={paymentRequestId || ''}
            onBack={() => {
              if (previousScreen) {
                setCurrentScreen(previousScreen);
                setPreviousScreen(null);
              } else {
                setCurrentScreen('ManagerRequests');
              }
            }}
            onPaymentComplete={() => {
              setCurrentScreen('ManagerRequests');
            }}
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
              // Fix: Persist requestId when approving directly
              setReviewRequestId(requestId);
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
            onNavigateToNotifications={navigateToNotifications}
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
            onContinueToQuotation={(selectedIds) => {
              setSelectedSupplierIdsForInvite(selectedIds);
              // Ensure we carry over the requestId from the review flow
              setQuotationRequestId(reviewRequestId);
              setPreviousScreen('SupplierSearch');
              setCurrentScreen('QuotationInvite');
            }}
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
              // stay or go back
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
      case 'QuotationInvite':
        return (
          <QuotationInviteScreen
            requestId={quotationRequestId || ''}
            gestorId={currentUser?.id || ''}
            initialSelectedSuppliers={selectedSupplierIdsForInvite}
            onNavigateBack={() => {
              if (previousScreen) {
                setCurrentScreen(previousScreen);
                setPreviousScreen(null);
              } else {
                setCurrentScreen('ManagerDashboard');
              }
            }}
            onSuccess={() => {
              // Redirect to QuotationCompareScreen to monitor progress
              // Ensure we KEEP the requestId (it should be in quotationRequestId state)
              if (!quotationRequestId) {
                // Fallback: try to use reviewRequestId if available
                if (reviewRequestId) setQuotationRequestId(reviewRequestId);
              }
              setSelectedSupplierIdsForInvite([]);
              setCurrentScreen('QuotationCompare');
            }}
          />
        );
      case 'ProviderQuotations':
        return (
          <ProviderQuotationsScreen
            supplierId={currentUser?.id || ''}
            onNavigateBack={() => setCurrentScreen('SupplierDashboard')}
            onNavigateToDashboard={() => setCurrentScreen('SupplierDashboard')}
            onNavigateToProfile={() => setCurrentScreen('SupplierProfile')}
            onLogout={handleLogout}
            onNavigateToQuotationForm={(invitationId, requestId) => {
              setQuotationInvitationId(invitationId);
              setQuotationRequestId(requestId);
              setCurrentScreen('QuotationForm');
            }}
          />
        );
      case 'QuotationForm':
        return (
          <QuotationFormScreen
            invitationId={quotationInvitationId || ''}
            requestId={quotationRequestId || ''}
            supplierId={currentUser?.id || ''}
            supplierName={currentUser?.companyName || currentUser?.firstName || ''}
            onNavigateBack={() => setCurrentScreen('ProviderQuotations')}
            onSuccess={() => {
              setQuotationInvitationId(null);
              setQuotationRequestId(null);
              setCurrentScreen('ProviderQuotations');
            }}
            onNavigateToPurchaseOrder={navigateToPurchaseOrder}
          />
        );
      case 'QuotationCompare':
        return (
          <QuotationCompareScreen
            requestId={quotationRequestId || ''}
            onNavigateBack={() => {
              if (previousScreen) {
                setCurrentScreen(previousScreen);
                setPreviousScreen(null);
              } else {
                setCurrentScreen('ManagerDashboard');
              }
            }}
            onSuccess={() => {
              // When winner is selected or finished
              setQuotationRequestId(null);
              setCurrentScreen('ManagerDashboard');
            }}
            onNavigateToPurchaseOrder={navigateToPurchaseOrder}
            onNavigateToSearch={(requestId) => {
              setReviewRequestId(requestId);
              setPreviousScreen('QuotationCompare');
              setCurrentScreen('SupplierSearch');
            }}
            currentUser={currentUser}
          />
        );
      case 'Notifications':
        // Use role-specific notification screens
        if (currentUser?.role === UserRole.PROVEEDOR) {
          return (
            <SupplierNotificationsScreen
              onNavigateToQuotations={navigateToProviderQuotations}
              onNavigateToProfile={() => setCurrentScreen('SupplierProfile')}
              onNavigateToNotifications={navigateToNotifications}
              onLogout={handleLogout}
            />
          );
        }

        if (currentUser?.role === UserRole.GESTOR) {
          return (
            <ManagerNotificationsScreen
              onNavigateToDashboard={() => setCurrentScreen('ManagerDashboard')}
              onNavigateToRequests={() => navigateToManagerRequests()}
              onNavigateToSuppliers={navigateToSupplierList}
              onNavigateToProfile={navigateToManagerProfile}
              onNavigateToNotifications={navigateToNotifications}
              currentUserOverride={currentUser}
            />
          );
        }

        if (currentUser?.role === UserRole.SOLICITANTE) {
          return (
            <SolicitanteNotificationsScreen
              onNavigateToDashboard={() => setCurrentScreen('SolicitanteDashboard')}
              onNavigateToNewRequest={() => setCurrentScreen('NewRequest')}
              onNavigateToHistory={() => setCurrentScreen('SolicitanteHistory')}
              onNavigateToProfile={() => setCurrentScreen('SolicitanteProfile')}
              onNavigateToNotifications={navigateToNotifications}
            />
          );
        }

        // Fallback to generic NotificationsScreen for other roles
        return (
          <NotificationsScreen
            userId={currentUser?.id || ''}
            onNavigateBack={() => {
              if (previousScreen) {
                setCurrentScreen(previousScreen);
                setPreviousScreen(null);
              } else {
                setCurrentScreen('Login');
              }
            }}
            onNavigateToRequest={(requestId) => {
              setQuotationRequestId(requestId);
              setCurrentScreen('QuotationCompare');
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