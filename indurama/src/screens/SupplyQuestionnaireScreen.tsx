import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// Tipos para las preguntas
interface Question {
  id: number;
  text: string;
  points: number;
  selectedAnswer?: 'SI' | 'NO' | 'N/A';
  observation?: string;
}

// Props para la pantalla
interface SupplyQuestionnaireScreenProps {
  onNavigateBack?: () => void;
  onComplete?: () => void;
  onNavigateToPhotoEvidence?: () => void;
}

/**
 * Pantalla de Cuestionario de Abastecimiento para el rol de Proveedor
 */
export const SupplyQuestionnaireScreen: React.FC<SupplyQuestionnaireScreenProps> = ({ 
  onNavigateBack,
  onComplete,
  onNavigateToPhotoEvidence
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(15);
  const totalQuestions = 24;
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 15,
      text: '¿Tiene la empresa un procedimiento de evaluación de proveedores?',
      points: 15
    },
    {
      id: 16,
      text: '¿Tiene la empresa un procedimiento de evaluación de proveedores?',
      points: 15
    },
    {
      id: 17,
      text: '¿Tiene la empresa un procedimiento de evaluación de proveedores?',
      points: 15
    },
    // Agregar más preguntas según sea necesario
  ]);

  const handleGoBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      console.log('Función de navegación de regreso no disponible');
    }
  };

  const handleAnswer = (questionId: number, answer: 'SI' | 'NO' | 'N/A') => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { ...q, selectedAnswer: answer }
        : q
    ));
  };

  const handleObservation = (questionId: number, observation: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { ...q, observation }
        : q
    ));
  };

  const handlePrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleNext = () => {
    console.log('Navegando a Evidencias Fotográficas');
    if (onNavigateToPhotoEvidence) {
      onNavigateToPhotoEvidence();
    }
  };

  const handleSaveAndExit = () => {
    setShowSaveModal(true);
  };

  const handleSaveModalClose = () => {
    setShowSaveModal(false);
    if (onComplete) {
      onComplete();
    }
  };

  const renderAnswerButtons = (question: Question) => {
    return (
      <View style={styles.answersContainer}>
        {['SI', 'NO', 'N/A'].map((answer) => (
          <TouchableOpacity
            key={answer}
            style={[
              styles.answerButton,
              question.selectedAnswer === answer && styles.answerButtonSelected
            ]}
            onPress={() => handleAnswer(question.id, answer as 'SI' | 'NO' | 'N/A')}
          >
            <Text style={[
              styles.answerButtonText,
              question.selectedAnswer === answer && styles.answerButtonTextSelected
            ]}>
              {answer}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderQuestion = (question: Question) => {
    return (
      <View key={question.id} style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionText}>{question.text}</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>{question.points} pts</Text>
          </View>
        </View>
        
        {renderAnswerButtons(question)}
        
        <View style={styles.observationSection}>
          <Text style={styles.observationLabel}>Observación / Evidencia</Text>
          <TextInput
            style={styles.observationInput}
            value={question.observation || ''}
            onChangeText={(text) => handleObservation(question.id, text)}
            placeholder="Describe tu respuesta o menciona la evidencia que respalda tu seleccion..."
            placeholderTextColor="#999999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>
    );
  };

  const getCurrentQuestion = () => {
    return questions.find(q => q.id === currentQuestion) || questions[0];
  };

  const getProgressPercentage = () => {
    return Math.round((currentQuestion / totalQuestions) * 100);
  };

  const currentQuestionData = getCurrentQuestion();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Image 
            source={require('../../assets/icons/arrow-left.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>CUESTIONARIO ABASTECIMIENTO</Text>
        </View>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/icono_indurama.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <Text style={styles.progressText}>Pregunta {currentQuestion} de {totalQuestions}</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressBarFill, { width: `${getProgressPercentage()}%` }]} />
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {questions.map(question => renderQuestion(question))}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        <View style={styles.navigationButtons}>
          <TouchableOpacity 
            style={[styles.navButton, styles.previousButton]} 
            onPress={handlePrevious}
            disabled={currentQuestion === 1}
          >
            <Text style={[
              styles.navButtonText, 
              styles.previousButtonText,
              currentQuestion === 1 && styles.disabledButtonText
            ]}>
              Anterior
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, styles.nextButton]} 
            onPress={handleNext}
          >
            <Text style={[styles.navButtonText, styles.nextButtonText]}>
              Siguiente
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndExit}>
          <Image 
            source={require('../../assets/icons/document.png')}
            style={styles.saveIcon}
            resizeMode="contain"
          />
          <Text style={styles.saveButtonText}>Guardar y Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Cuestionario Guardado */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cuestionario Guardado</Text>
            <Text style={styles.modalMessage}>
              Se ha guardado correctamente
            </Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={handleSaveModalClose}
            >
              <Text style={styles.modalButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#333333',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  progressSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    flex: 1,
    lineHeight: 24,
    marginRight: 12,
  },
  pointsBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  answersContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  answerButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  answerButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  answerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  answerButtonTextSelected: {
    color: '#2196F3',
  },
  observationSection: {
    marginTop: 8,
  },
  observationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
  },
  observationInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333333',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  previousButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: '#003E85',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  previousButtonText: {
    color: '#666666',
  },
  nextButtonText: {
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#CCCCCC',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  saveIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#666666',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#666666',
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
});