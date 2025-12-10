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
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// Props para la pantalla
interface SupplierWelcomeScreenProps {
  onContinueToEvaluation?: () => void;
}

/**
 * Pantalla de Bienvenida para el rol de Proveedor
 */
export const SupplierWelcomeScreen: React.FC<SupplierWelcomeScreenProps> = ({ 
  onContinueToEvaluation
}) => {
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    position: ''
  });

  const handleContinue = () => {
    if (onContinueToEvaluation) {
      onContinueToEvaluation();
    } else {
      console.log('Función de navegación a evaluación no disponible');
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Logo e información de bienvenida */}
        <View style={styles.welcomeSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/icono_indurama.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          
          
          <Text style={styles.welcomeMessage}>
            Bienvenido, proveedor. Indurama te invita a ser un proveedor evaluado.
          </Text>
          
          <Text style={styles.roleTitle}>Responsable de la EPI</Text>
        </View>

        {/* Formulario */}
        <View style={styles.formSection}>
          
          {/* Nombre y Apellidos */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre y Apellidos</Text>
            <TextInput
              style={styles.textInput}
              placeholder="proveedor@nuevo.com"
              placeholderTextColor="#999999"
              value={formData.fullName}
              onChangeText={(value) => updateFormData('fullName', value)}
              autoCapitalize="words"
            />
          </View>

          {/* Correo */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo</Text>
            <TextInput
              style={styles.textInput}
              placeholder="proveedor@nuevo.com"
              placeholderTextColor="#999999"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Cargo */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cargo</Text>
            <TextInput
              style={styles.textInput}
              placeholder="proveedor@nuevo.com"
              placeholderTextColor="#999999"
              value={formData.position}
              onChangeText={(value) => updateFormData('position', value)}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Botón de continuar */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continuar con la EPI</Text>
          </TouchableOpacity>
        </View>
        
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    flex: 1,
    paddingHorizontal: isMobile ? 24 : 40,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoImage: {
    width: 180,
    height: 180,
  },
  companyName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#003E85',
    marginBottom: 24,
    textAlign: 'center',
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  formSection: {
    paddingHorizontal: 8,
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333333',
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
  buttonSection: {
    paddingHorizontal: 8,
    paddingBottom: 40,
  },
  continueButton: {
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
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});