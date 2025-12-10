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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

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
  onSignOut
}) => {
  const [showEpiModal, setShowEpiModal] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const { signOut, user } = useAuth();
  const [tasks, setTasks] = React.useState<Task[]>([
    {
      id: '1',
      title: 'Creación de Proveedor',
      status: 'completed',
      progress: 'Completado (1 de 1)'
    },
    {
      id: '2',
      title: 'Cuestionario de Calidad',
      status: 'in-progress',
      progress: 'En Progreso (15 de 20)'
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
      status: 'in-progress',
      progress: 'En Progreso (2 de 3)'
    }
  ]);

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

  const getTaskIcon = (status: string) => {
    let iconSource;
    switch (status) {
      case 'completed':
        iconSource = require('../../assets/icons/check.png');
        break;
      case 'in-progress':
        iconSource = require('../../assets/icons/clock.png');
        break;
      default:
        iconSource = require('../../assets/icons/clock.png');
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
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>MI EVALUACIÓN EPI</Text>
            
            <View style={styles.rightSection}>
              {/* Logo de Indurama */}
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/icono_indurama.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.headerActions}>
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
                  <Image
                    source={require('../../assets/icons/chevron-down.png')}
                    style={styles.chevronIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Subtítulo */}
        <Text style={styles.subtitle}>
          Complete todos los pasos
        </Text>

        {/* Progreso General */}
        <View style={styles.progressContainer}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Progreso General</Text>
                <Text style={styles.progressPercentage}>43%</Text>
                <Text style={styles.progressDetails}>18 de 42 tareas completadas</Text>
              </View>
              <View style={styles.progressIconContainer}>
                <View style={styles.progressIcon}>
                  <Image 
                    source={require('../../assets/icons/check.png')}
                    style={styles.progressIconImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>
            
            {/* Barra de progreso */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressBarFill, { width: '43%' }]} />
              </View>
            </View>
            
            <Text style={styles.progressMessage}>
              Completa todas las secciones al 100% para enviar tu evaluación
            </Text>
          </View>
        </View>

        {/* Tareas Pendientes */}
        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>Tareas pendientes</Text>
          
          <View style={styles.tasksList}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                iconSource={getTaskIcon(task.status)}
                iconColor={getTaskIconColor(task.status)}
                iconBackground={getTaskIconBackground(task.status)}
                onPress={() => handleTaskClick(task.id)}
              />
            ))}
          </View>
        </View>

        {/* Botón de completar tareas */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteTasks}>
            <Text style={styles.completeButtonText}>Completar Tareas para Enviar</Text>
          </TouchableOpacity>
        </View>
        
      </ScrollView>

      {/* Modal de Epi Enviada */}
      <Modal
        visible={showEpiModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEpiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Epi Enviada</Text>
            <Text style={styles.modalMessage}>
              Se le notificara una vez finalizado la{"\n"}evaluacion
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
              <Image
                source={require('../../assets/icons/exit.png')}
                style={styles.menuIcon}
                resizeMode="contain"
              />
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
              width: task.id === '1' ? '100%' :  // Creación de Proveedor - Completado
                     task.id === '2' ? '75%' :   // Cuestionario de Calidad - 15/20
                     task.id === '4' ? '67%' :   // Evidencias Fotográficas - 2/3
                     '0%',                        // Cuestionario de Abastecimiento - Pendiente
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
    backgroundColor: '#F8F9FB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: isMobile ? 20 : 40,
    paddingBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 52,
    height: 52,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActions: {},
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#003E85',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chevronIcon: {
    width: 14,
    height: 14,
    tintColor: '#0F172A',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: isMobile ? 20 : 40,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#003E85',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  progressPercentage: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  progressDetails: {
    fontSize: 12,
    color: '#666666',
  },
  progressIconContainer: {
    marginLeft: 16,
  },
  progressIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressIconText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressIconImage: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#003E85',
    borderRadius: 4,
  },
  progressMessage: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  tasksSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  taskIconImage: {
    width: 20,
    height: 20,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  taskProgress: {
    fontSize: 12,
    color: '#666666',
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
  buttonSection: {
    paddingBottom: 40,
  },
  completeButton: {
    backgroundColor: '#003E85',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginHorizontal: 40,
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  menuContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    right: isMobile ? 20 : 40,
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
  },
  menuLabel: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuIcon: {
    width: 18,
    height: 18,
    tintColor: '#003E85',
    marginRight: 10,
  },
  menuText: {
    fontSize: 15,
    color: '#0F172A',
  },
});