import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { SupplierResponseService } from '../../services/supplierResponseService';

import { useWindowDimensions } from 'react-native';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';

const { width: screenWidth } = Dimensions.get('window');

// Tipos para las tareas
interface Task {
  id: string;
  title: string;
  status: 'completed' | 'pending' | 'in-progress';
  progress: string;
}

// Props para la pantalla
interface SupplierEvaluationScreenProps {
  onNavigateBack?: () => void;
  onNavigateToCreation?: () => void;
  onNavigateToQuestionnaireQuality?: () => void;
  onNavigateToQuestionnaireSupply?: () => void;
  onNavigateToPhotoEvidence?: () => void;
  taskCompletedFromCreation?: boolean;
  onSignOut?: () => void;
  onNavigateToDashboard?: () => void;
  user?: any; // NEW: Accept user as prop
}

/**
 * Pantalla de Evaluación EPI para el rol de Proveedor
 */
export const SupplierEvaluationScreen: React.FC<SupplierEvaluationScreenProps> = ({
  onNavigateBack,
  onNavigateToCreation,
  onNavigateToQuestionnaireQuality,
  onNavigateToQuestionnaireSupply,
  onNavigateToPhotoEvidence,
  taskCompletedFromCreation,
  onSignOut,
  onNavigateToDashboard,
  user: userProp
}) => {
  console.log('Rendering SupplierEvaluationScreen');
  const [showEpiModal, setShowEpiModal] = React.useState(false);
  const { signOut, user: contextUser } = useAuth();
  // Prioritize prop user, then context user
  const user = userProp || contextUser;

  console.log('SupplierEvaluationScreen User:', user);
  const [showMenu, setShowMenu] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  // Responsive
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Nav items for shell
  const navItems = [
    { key: 'Dashboard', label: 'Inicio', iconName: 'home' as any, onPress: onNavigateToDashboard || (() => { }) },
    { key: 'EPIStatus', label: 'Mi EPI', iconName: 'clipboard-outline' as any, onPress: () => { } },
    { key: 'Logout', label: 'Salir', iconName: 'log-out-outline' as any, onPress: onSignOut || (() => { }) },
  ];

  const [tasks, setTasks] = React.useState<Task[]>([
    {
      id: '1',
      title: 'Creación de Proveedor',
      status: 'pending',
      progress: 'Pendiente (0 de 1)'
    },
    {
      id: '2',
      title: 'Cuestionario de Calidad',
      status: 'pending',
      progress: 'Pendiente (0 de 20)'
    },
    {
      id: '3',
      title: 'Cuestionario de Abastecimiento',
      status: 'pending',
      progress: 'Pendiente (0 de 18)'
    },
    {
      id: '4',
      title: 'Evidencias Fotográficas',
      status: 'pending',
      progress: 'Pendiente (0 de 3)'
    }
  ]);
  const [globalProgress, setGlobalProgress] = React.useState(0);
  const [completedTasks, setCompletedTasks] = React.useState(0);

  // EPI Submission states - NEW
  const [epiSubmission, setEpiSubmission] = React.useState<any | null>(null);
  const [canSubmit, setCanSubmit] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [submitLoading, setSubmitLoading] = React.useState(false);

  // Load real progress data
  React.useEffect(() => {
    const loadProgress = async () => {
      if (!user?.id) return;

      try {
        // Reload user data from Firestore to get latest profileCompleted status
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../services/firebaseConfig');
        const userDocRef = doc(db, 'users', user.id);
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.exists() ? userSnap.data() : null;

        // Check if supplier profile is configured
        const hasProfileData = userData?.profileCompleted === true;

        // Load REAL evaluation data from SupplierResponseService
        // Use static import instead of dynamic which can fail in some bundlers
        const evaluation = await SupplierResponseService.getSupplierEvaluation(user.id);

        let qualityAnswered = 0;
        let supplyAnswered = 0;
        let totalQualityQuestions = 20; // Default
        let totalSupplyQuestions = 18; // Default

        if (evaluation) {
          const calidadResponses = evaluation.responses.filter(r => r.category === 'calidad');
          const abastecimientoResponses = evaluation.responses.filter(r => r.category === 'abastecimiento');

          qualityAnswered = calidadResponses.length;
          supplyAnswered = abastecimientoResponses.length;

          // Use actual totals from progress
          totalQualityQuestions = evaluation.progress?.calidadQuestions || 20;
          totalSupplyQuestions = evaluation.progress?.abastecimientoQuestions || 18;
        }

        const updatedTasks: Task[] = [
          {
            id: '1',
            title: 'Creación de Proveedor',
            status: hasProfileData ? 'completed' : 'pending',
            progress: hasProfileData ? 'Completado (1 de 1)' : 'Pendiente (0 de 1)'
          },
          {
            id: '2',
            title: 'Cuestionario de Calidad',
            status: qualityAnswered === 0 ? 'pending' : (qualityAnswered >= totalQualityQuestions ? 'completed' : 'in-progress'),
            progress: `${qualityAnswered === 0 ? 'Pendiente' : (qualityAnswered >= totalQualityQuestions ? 'Completado' : 'En Progreso')} (${qualityAnswered} de ${totalQualityQuestions})`
          },
          {
            id: '3',
            title: 'Cuestionario de Abastecimiento',
            status: supplyAnswered === 0 ? 'pending' : (supplyAnswered >= totalSupplyQuestions ? 'completed' : 'in-progress'),
            progress: `${supplyAnswered === 0 ? 'Pendiente' : (supplyAnswered >= totalSupplyQuestions ? 'Completado' : 'En Progreso')} (${supplyAnswered} de ${totalSupplyQuestions})`
          },
          {
            id: '4',
            title: 'Evidencias Fotográficas',
            status: (evaluation?.photoEvidence?.length || 0) > 0 ? 'completed' : 'pending',
            progress: (evaluation?.photoEvidence?.length || 0) > 0
              ? `Completado (${evaluation?.photoEvidence?.length} de 3)`
              : 'Pendiente (0 de 3)'
          }
        ];

        setTasks(updatedTasks);

        // Calculate global progress
        const completed = updatedTasks.filter(t => t.status === 'completed').length;
        const progress = Math.round((completed / updatedTasks.length) * 100);
        setGlobalProgress(progress);
        setCompletedTasks(completed);

        // Check if all tasks are completed (can submit)
        const allComplete = updatedTasks.every(t => t.status === 'completed');
        setCanSubmit(allComplete && !isSubmitted);

        // Load EPI submission status
        const submission = await SupplierResponseService.getEPISubmission(user.id);
        setEpiSubmission(submission);
        setIsSubmitted(submission?.status === 'submitted' || submission?.status === 'approved');
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };

    loadProgress();

    // Also reload when taskCompletedFromCreation changes
  }, [user?.id, taskCompletedFromCreation]);

  const handleGoBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      console.log('Función de navegación de regreso no disponible');
    }
  };

  const handleCompleteTasks = () => {
    setShowEpiModal(true);
  };

  const handleEpiModalClose = () => {
    setShowEpiModal(false);
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  const handleTaskClick = (taskId: string) => {
    if (taskId === '1' && onNavigateToCreation) {
      onNavigateToCreation();
    } else if (taskId === '2' && onNavigateToQuestionnaireQuality) {
      onNavigateToQuestionnaireQuality();
    } else if (taskId === '3' && onNavigateToQuestionnaireSupply) {
      onNavigateToQuestionnaireSupply();
    } else if (taskId === '4' && onNavigateToPhotoEvidence) {
      onNavigateToPhotoEvidence();
    } else {
      console.log('Tarea clickeada:', taskId);
    }
  };

  const toggleMenu = () => {
    setShowMenu(prev => !prev);
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  const handleSignOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const result = await signOut();
      if (result.success) {
        onSignOut?.();
      } else if (result.error) {
        console.warn('No fue posible cerrar sesión:', result.error);
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setLoggingOut(false);
      setShowMenu(false);
    }
  };


  // NEW: Handle EPI submission
  const handleSubmitEvaluation = async () => {
    console.log('🔥🔥🔥 BUTTON CLICKED - handleSubmitEvaluation CALLED');
    console.log('User:', user);
    console.log('canSubmit:', canSubmit);

    // Platform-specific confirmation dialog
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('¿Estás seguro de enviar tu evaluación EPI?\n\nNo podrás editar después del envío.');
      if (!confirmed) return;

      try {
        setSubmitLoading(true);
        await SupplierResponseService.submitEvaluation(user!.id);

        // Reload submission status to show "Enviado" banner
        const newSubmission = await SupplierResponseService.getEPISubmission(user!.id);
        setEpiSubmission(newSubmission);
        setIsSubmitted(true);
        setCanSubmit(false);

        window.alert('Tu evaluación EPI ha sido enviada correctamente.\n\nEl gestor la revisará pronto.');
      } catch (error: any) {
        window.alert('Error: ' + (error.message || 'No se pudo enviar la evaluación'));
      } finally {
        setSubmitLoading(false);
      }
    } else {
      Alert.alert(
        'Confirmar Envío',
        '¿Estás seguro de enviar tu evaluación EPI?\n\nNo podrás editar después del envío.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Enviar',
            style: 'default',
            onPress: async () => {
              try {
                setSubmitLoading(true);
                await SupplierResponseService.submitEvaluation(user!.id);

                // Reload submission status
                const newSubmission = await SupplierResponseService.getEPISubmission(user!.id);
                setEpiSubmission(newSubmission);
                setIsSubmitted(true);
                setCanSubmit(false);

                Alert.alert('Éxito', 'Tu evaluación EPI ha sido enviada correctamente.\n\nEl gestor la revisará pronto.');
              } catch (error: any) {
                Alert.alert('Error', error.message || 'No se pudo enviar la evaluación');
              } finally {
                setSubmitLoading(false);
              }
            }
          }
        ]
      );
    }
  };

  const getTaskIcon = (status: string) => {
    let iconSource;
    switch (status) {
      case 'completed':
        iconSource = require('../../../assets/icons/check.png');
        break;
      case 'in-progress':
        iconSource = require('../../../assets/icons/clock.png');
        break;
      default:
        iconSource = require('../../../assets/icons/clock.png');
        break;
    }
    return iconSource;
  };

  const getTaskIconColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#00BFA5';
      case 'in-progress':
        return '#00BFA5';
      default:
        return '#9E9E9E';
    }
  };

  const getTaskIconBackground = (status: string) => {
    switch (status) {
      case 'completed':
        return '#E0F7F4';
      case 'in-progress':
        return '#E0F7F4';
      default:
        return '#F5F5F5';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Blue Header */}
      <View style={[styles.header, !isMobile && styles.headerWeb]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerGreeting}>Mi Evaluación</Text>
            <Text style={styles.headerTitle}>EPI INDURAMA</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={toggleMenu}
              activeOpacity={0.8}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.[0]?.toUpperCase() || 'P'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Centered Content Container with maxWidth */}
        <View style={styles.centeredContainer}>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Complete todos los pasos para enviar su evaluación
          </Text>

          {/* Two Column Layout for Web */}
          <View style={[styles.mainContent, !isMobile && styles.mainContentWeb]}>

            {/* Left Column - Progress Card */}
            <View style={[styles.progressColumn, !isMobile && styles.progressColumnWeb]}>
              <View style={styles.progressCard}>
                <View style={styles.progressCardHeader}>
                  <View style={styles.progressCircleContainer}>
                    <View style={[
                      styles.progressCircle,
                      globalProgress === 100 && styles.progressCircleComplete
                    ]}>
                      <Text style={[
                        styles.progressCircleText,
                        globalProgress === 100 && styles.progressCircleTextComplete
                      ]}>
                        {globalProgress}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressLabel}>Progreso General</Text>
                    <Text style={styles.progressDetails}>{completedTasks} de 4 tareas completadas</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressBarFill,
                      { width: `${globalProgress}%` },
                      globalProgress === 100 && styles.progressBarFillComplete
                    ]} />
                  </View>
                </View>

                <Text style={styles.progressMessage}>
                  {globalProgress === 100
                    ? '¡Listo para enviar tu evaluación!'
                    : 'Completa todas las secciones al 100%'}
                </Text>
              </View>

              {/* Submit Section - In left column on web */}
              {!isMobile && !isSubmitted && (
                <View style={styles.submitSectionWeb}>
                  {!canSubmit && (
                    <View style={styles.warningBanner}>
                      <Ionicons name="alert-circle" size={24} color="#F57C00" />
                      <Text style={styles.warningText}>
                        Completa todas las tareas para enviar
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      !canSubmit && styles.submitButtonDisabled
                    ]}
                    disabled={!canSubmit || submitLoading}
                    onPress={handleSubmitEvaluation}
                  >
                    <Ionicons
                      name={canSubmit ? "checkmark-circle" : "lock-closed"}
                      size={22}
                      color={canSubmit ? "#FFF" : "#AAA"}
                    />
                    <Text style={[
                      styles.submitButtonText,
                      !canSubmit && styles.submitButtonTextDisabled
                    ]}>
                      {submitLoading ? 'Enviando...' : 'Enviar Evaluación'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Submitted Banner - In left column on web */}
              {!isMobile && isSubmitted && epiSubmission && (
                <View style={styles.submittedBanner}>
                  <View style={styles.submittedIconContainer}>
                    <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
                  </View>
                  <View style={styles.submittedContent}>
                    <Text style={styles.submittedTitle}>Evaluación Enviada</Text>
                    <Text style={styles.submittedText}>
                      Enviado el {epiSubmission.submittedAt?.toDate?.().toLocaleDateString('es-ES') || 'Recientemente'}
                    </Text>
                    <TouchableOpacity
                      style={styles.dashboardButton}
                      onPress={onNavigateToDashboard}
                    >
                      <Text style={styles.dashboardButtonText}>Ir al Dashboard</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Right Column - Tasks */}
            <View style={[styles.tasksColumn, !isMobile && styles.tasksColumnWeb]}>
              <Text style={styles.sectionTitle}>Tareas pendientes</Text>

              <View style={[styles.tasksList, !isMobile && styles.tasksListWeb]}>
                {tasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[styles.taskCard, !isMobile && styles.taskCardWeb]}
                    activeOpacity={0.7}
                    onPress={() => handleTaskClick(task.id)}
                  >
                    <View style={[
                      styles.taskIconContainer,
                      { backgroundColor: getTaskIconBackground(task.status) }
                    ]}>
                      <Ionicons
                        name={task.status === 'completed' ? 'checkmark-circle' :
                          task.status === 'in-progress' ? 'time' : 'ellipse-outline'}
                        size={24}
                        color={getTaskIconColor(task.status)}
                      />
                    </View>
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={[
                        styles.taskProgress,
                        task.status === 'completed' && styles.taskProgressComplete
                      ]}>
                        {task.progress}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Mobile-only Submit Section */}
          {isMobile && !isSubmitted && (
            <View style={styles.submitSection}>
              {!canSubmit && (
                <View style={styles.warningBanner}>
                  <Ionicons name="alert-circle" size={24} color="#F57C00" />
                  <Text style={styles.warningText}>
                    Completa todas las tareas para enviar tu evaluación
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !canSubmit && styles.submitButtonDisabled
                ]}
                disabled={!canSubmit || submitLoading}
                onPress={handleSubmitEvaluation}
              >
                <Ionicons
                  name={canSubmit ? "checkmark-circle" : "lock-closed"}
                  size={22}
                  color={canSubmit ? "#FFF" : "#AAA"}
                />
                <Text style={[
                  styles.submitButtonText,
                  !canSubmit && styles.submitButtonTextDisabled
                ]}>
                  {submitLoading ? 'Enviando...' : 'Enviar Evaluación EPI'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Mobile-only Submitted Banner */}
          {isMobile && isSubmitted && epiSubmission && (
            <View style={styles.submittedBanner}>
              <View style={styles.submittedIconContainer}>
                <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
              </View>
              <View style={styles.submittedContent}>
                <Text style={styles.submittedTitle}>Evaluación Enviada</Text>
                <Text style={styles.submittedText}>
                  Enviado el {epiSubmission.submittedAt?.toDate?.().toLocaleDateString('es-ES') || 'Recientemente'}
                </Text>
                <Text style={styles.submittedSubtext}>
                  Tu evaluación está siendo revisada por el gestor
                </Text>
                <TouchableOpacity
                  style={styles.dashboardButton}
                  onPress={onNavigateToDashboard}
                >
                  <Text style={styles.dashboardButtonText}>Ir al Dashboard</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* EPI Modal */}
      <Modal
        visible={showEpiModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEpiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" style={{ marginBottom: 16 }} />
            <Text style={styles.modalTitle}>EPI Enviada</Text>
            <Text style={styles.modalMessage}>
              Se le notificará una vez finalizada la evaluación
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleEpiModalClose}
            >
              <Text style={styles.modalButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* User Menu Dropdown */}
      {showMenu && (
        <>
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={handleCloseMenu}
          />
          <View style={styles.menuContainer}>
            <Text style={styles.menuLabel}>
              {user ? `${user.firstName} ${user.lastName}` : 'Proveedor'}
            </Text>
            <TouchableOpacity
              style={[styles.menuItem, loggingOut && styles.menuItemDisabled]}
              onPress={handleSignOut}
              disabled={loggingOut}
            >
              <Ionicons name="log-out-outline" size={20} color="#003E85" />
              <Text style={styles.menuText}>
                {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

// Componente de tarjeta de tarea
const TaskCard: React.FC<{
  task: Task;
  iconSource: any;
  iconColor: string;
  iconBackground: string;
  onPress: () => void;
}> = ({ task, iconSource, iconColor, iconBackground, onPress }) => {
  return (
    <TouchableOpacity style={styles.taskCard} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.taskContent}>
        <View style={[styles.taskIconContainer, { backgroundColor: iconBackground }]}>
          <Image
            source={iconSource}
            style={[styles.taskIconImage, { tintColor: iconColor }]}
            resizeMode="contain"
          />
        </View>

        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskProgress}>{task.progress}</Text>
        </View>
      </View>

      {/* Barra de progreso de la tarea */}
      <View style={styles.taskProgressBarContainer}>
        <View style={styles.taskProgressBar}>
          <View style={[
            styles.taskProgressBarFill,
            {
              width: task.status === 'completed' ? '100%' :
                task.status === 'in-progress' ? '50%' :
                  '0%',
              backgroundColor: task.status === 'pending' ? '#E0E0E0' : '#003E85'
            }
          ]} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  // Header styles
  header: {
    backgroundColor: '#003E85',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerWeb: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#003E85',
    fontWeight: '700',
    fontSize: 14,
  },
  // Scroll and Layout
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  centeredContainer: {
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
    textAlign: 'center',
  },
  // Two Column Layout
  mainContent: {
    flexDirection: 'column',
  },
  mainContentWeb: {
    flexDirection: 'row',
    gap: 24,
  },
  progressColumn: {
    marginBottom: 24,
  },
  progressColumnWeb: {
    flex: 4,
    marginBottom: 0,
  },
  tasksColumn: {
    marginBottom: 24,
  },
  tasksColumnWeb: {
    flex: 6,
    marginBottom: 0,
  },
  // Progress Card
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressCircleContainer: {
    marginRight: 16,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#003E85',
  },
  progressCircleComplete: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  progressCircleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003E85',
  },
  progressCircleTextComplete: {
    color: '#22C55E',
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  progressDetails: {
    fontSize: 13,
    color: '#64748B',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#003E85',
    borderRadius: 5,
  },
  progressBarFillComplete: {
    backgroundColor: '#22C55E',
  },
  progressMessage: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Tasks
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  tasksList: {
    gap: 12,
  },
  tasksListWeb: {
    flexDirection: 'column',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  taskCardWeb: {
    // Same or slight adjustments
  },
  taskIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  taskProgress: {
    fontSize: 13,
    color: '#64748B',
  },
  taskProgressComplete: {
    color: '#22C55E',
    fontWeight: '600',
  },
  // Enhanced Task Card styles
  sectionSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
  },
  taskCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  taskDescription: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 8,
  },
  taskProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskProgressBarMini: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  taskProgressBarFillMini: {
    height: '100%',
    borderRadius: 3,
  },
  taskProgressText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    minWidth: 70,
    textAlign: 'right',
  },
  taskProgressTextComplete: {
    color: '#22C55E',
    fontWeight: '600',
  },
  // Submit Section
  submitSection: {
    marginTop: 24,
  },
  submitSectionWeb: {
    marginTop: 20,
  },
  warningBanner: {
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#C2410C',
    fontWeight: '500',
    marginLeft: 12,
  },
  submitButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButtonTextDisabled: {
    color: '#94A3B8',
  },
  // Submitted Banner
  submittedBanner: {
    backgroundColor: '#F0FDF4',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  submittedIconContainer: {
    marginRight: 16,
  },
  submittedContent: {
    flex: 1,
  },
  submittedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  submittedText: {
    fontSize: 14,
    color: '#16A34A',
    marginBottom: 4,
  },
  submittedSubtext: {
    fontSize: 13,
    color: '#4ADE80',
  },
  dashboardButton: {
    backgroundColor: '#003E85',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  dashboardButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 32,
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Menu
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  menuContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 20,
  },
  menuLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 12,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  // Legacy styles (keeping for TaskCard component compatibility)
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskIconImage: {
    width: 20,
    height: 20,
  },
  taskProgressBarContainer: {
    marginTop: 8,
  },
  taskProgressBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  taskProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});