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
interface QualityQuestionnaireScreenProps {
  onNavigateBack?: () => void;
  onComplete?: () => void;
  onNavigateToSupplyQuestionnaire?: () => void;
}

/**
 * Pantalla de Cuestionario de Calidad para el rol de Proveedor
 */
export const QualityQuestionnaireScreen: React.FC<QualityQuestionnaireScreenProps> = ({ 
  onNavigateBack,
  onComplete,
  onNavigateToSupplyQuestionnaire
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(15); // Empezamos en pregunta 15
  const totalQuestions = 20;
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 15,
      text: 'Dispone de certificaciones de su SGC (ISO 9001, etc.)?',
      points: 15
    },
    {
      id: 16,
      text: 'Dispone de certificaciones de su SGC (ISO 9001, etc.)?',
      points: 15
    },
    {
      id: 17,
      text: 'Dispone de certificaciones de su SGC (ISO 9001, etc.)?',
      points: 15
    }
  ]);

  const handleGoBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      console.log('Función de navegación de regreso no disponible');
    }
  };

  const handleAnswerSelect = (questionId: number, answer: 'SI' | 'NO' | 'N/A') => {
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.id === questionId ? { ...q, selectedAnswer: answer } : q
      )
    );
  };

  const handleObservationChange = (questionId: number, observation: string) => {
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.id === questionId ? { ...q, observation } : q
      )
    );
  };

  const handlePrevious = () => {
    console.log('Anterior');
    // Implementar lógica para página anterior
  };

  const handleNext = () => {
    console.log('Navegando a Cuestionario de Abastecimiento');
    if (onNavigateToSupplyQuestionnaire) {
      onNavigateToSupplyQuestionnaire();
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
      <View style={styles.answerButtonsContainer}>
        {['SI', 'NO', 'N/A'].map((answer) => (
          <TouchableOpacity
            key={answer}
            style={[
              styles.answerButton,
              question.selectedAnswer === answer && styles.selectedAnswerButton
            ]}
            onPress={() => handleAnswerSelect(question.id, answer as 'SI' | 'NO' | 'N/A')}
          >
            <Text style={[
              styles.answerButtonText,
              question.selectedAnswer === answer && styles.selectedAnswerButtonText
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
      <View key={question.id} style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionText}>{question.text}</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>{question.points} pts</Text>
          </View>
        </View>
        
        {renderAnswerButtons(question)}
        
        <View style={styles.observationContainer}>
          <Text style={styles.observationLabel}>Observacion / Evidencia</Text>
          <TextInput
            style={styles.observationInput}
            value={question.observation || ''}
            onChangeText={(text) => handleObservationChange(question.id, text)}
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
          <Text style={styles.headerTitle}>CUESTIONARIO CALIDAD</Text>
        </View>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/icono_indurama.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Pregunta {currentQuestion} de {totalQuestions}</Text>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill, 
            { width: `${(currentQuestion / totalQuestions) * 100}%` }
          ]} />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {questions.map(question => renderQuestion(question))}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.navigationButton} onPress={handlePrevious}>
          <Text style={styles.navigationButtonText}>Anterior</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndExit}>
          <Image 
            source={require('../../assets/icons/document.png')}
            style={styles.saveIcon}
            resizeMode="contain"
          />
          <Text style={styles.saveButtonText}>Guardar y Salir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navigationButton, styles.nextButton]} onPress={handleNext}>
          <Text style={[styles.navigationButtonText, styles.nextButtonText]}>Siguiente</Text>
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
    fontSize: 16,
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
  progressContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4FC3F7',
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  questionContainer: {
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
    color: '#333333',
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  pointsBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pointsText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  answerButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  answerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectedAnswerButton: {
    backgroundColor: '#003E85',
    borderColor: '#003E85',
  },
  answerButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  selectedAnswerButtonText: {
    color: '#FFFFFF',
  },
  observationContainer: {
    marginTop: 4,
  },
  observationLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  observationInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333333',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  navigationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#003E85',
    borderColor: '#003E85',
  },
  navigationButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  nextButtonText: {
    color: '#FFFFFF',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  saveIcon: {
    width: 16,
    height: 16,
    tintColor: '#666666',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
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