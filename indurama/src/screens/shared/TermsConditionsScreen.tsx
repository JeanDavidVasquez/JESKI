import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TermsConditionsScreen: React.FC<{
  visible?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  mandatory?: boolean;
}> = ({ visible, onAccept, onReject, mandatory = false }) => {

  const [termsText, setTermsText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showDoc, setShowDoc] = useState<boolean>(false);
  const [agreed, setAgreed] = useState<boolean>(false);

  const handleAccept = async () => {
    await AsyncStorage.setItem('termsAccepted', '1');
    onAccept?.();
  };

  const handleReject = async () => {
    await AsyncStorage.removeItem('termsAccepted');
    onReject?.();
  };

  // --- FUNCIÓN PARA LEER EL ARCHIVO .MD REAL ---
  const loadTermsFromFile = async () => {
    setLoading(true);
    try {
      // Importar desde el archivo TypeScript generado por sync-terms.js
      const { TERMS_TEXT } = await import('../../documents/terms/termsText');
      setTermsText(TERMS_TEXT);
    } catch (error) {
      console.warn('Error cargando terms.md:', error);
      setTermsText('# Error de Carga\n\nNo se pudo encontrar el archivo "terms.md".\n\n1. Verifique que la ruta en el `require` sea correcta.\n2. Asegúrese de tener configurado metro.config.js para aceptar extensiones .md (si usa Expo SDK < 50).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadTermsFromFile();
      setAgreed(false);
    }
  }, [visible]);

  // --- RENDERIZADOR DE MARKDOWN ---
  const renderInline = (text: string) => {
    if (!text) return null;
    const tokens: React.ReactNode[] = [];
    let rest = text;
    const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/;
    let keyIndex = 0;
    while (rest.length > 0) {
      const m = rest.match(regex);
      if (!m) {
        tokens.push(<Text key={keyIndex++}>{rest}</Text>);
        break;
      }
      const idx = m.index!;
      if (idx > 0) {
        tokens.push(<Text key={keyIndex++}>{rest.slice(0, idx)}</Text>);
      }
      if (m[1]) {
        // bold
        tokens.push(<Text key={keyIndex++} style={styles.bold}>{m[2]}</Text>);
      } else if (m[3]) {
        // italic
        tokens.push(<Text key={keyIndex++} style={styles.italic}>{m[4]}</Text>);
      } else if (m[5]) {
        // code
        tokens.push(<Text key={keyIndex++} style={styles.code}>{m[6]}</Text>);
      }
      rest = rest.slice(idx + m[0].length);
    }
    return tokens;
  };

  const renderMarkdown = (md: string | undefined | null) => {
    if (!md) return null;
    const lines = md.split(/\r?\n/);
    const nodes: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.replace(/\t/g, '    ').replace(/\s+$/g, '');
      if (!trimmed) {
        nodes.push(<View key={`br${idx}`} style={{ height: 8 }} />);
        return;
      }

      // H1..H6
      const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (hMatch) {
        const level = hMatch[1].length;
        const txt = hMatch[2];
        const key = `h${level}${idx}`;
        if (level === 1) nodes.push(<Text key={key} style={styles.h1}>{renderInline(txt)}</Text>);
        else if (level === 2) nodes.push(<Text key={key} style={styles.h2}>{renderInline(txt)}</Text>);
        else if (level === 3) nodes.push(<Text key={key} style={styles.h3}>{renderInline(txt)}</Text>);
        else nodes.push(<Text key={key} style={styles.h4}>{renderInline(txt)}</Text>);
        return;
      }

      // Lists
      if (/^\*\s+/.test(trimmed) || /^-\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
        const content = trimmed.replace(/^\*\s+/, '').replace(/^\-\s+/, '').replace(/^\d+\.\s+/, '');
        nodes.push(
          <View key={`li${idx}`} style={styles.listItem}>
            <Text style={styles.listBullet}>•</Text>
            <Text style={styles.listText}>{renderInline(content)}</Text>
          </View>
        );
        return;
      }

      // Default paragraph
      nodes.push(
        <Text key={`p${idx}`} style={styles.paragraph}>
          {renderInline(trimmed)}
        </Text>
      );
    });

    return <View>{nodes}</View>;
  };

  const preview = termsText ? (termsText.length > 420 ? termsText.slice(0, 420) + '...' : termsText) : '';

  const content = (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.innerContainer}>

          {/* Header Azul con botón Cerrar */}
          <View style={styles.headerBox}>
            {typeof visible === 'boolean' && (
              <TouchableOpacity
                style={{ position: 'absolute', top: 15, right: 15, zIndex: 10 }}
                onPress={() => onReject?.()}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            )}

            <Image source={require('../../../assets/icons/terms.png')} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>TÉRMINOS Y CONDICIONES</Text>
          </View>

          <View style={styles.termsBox}>
            {loading ? (
              <ActivityIndicator size="large" color="#003E85" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.previewContainer}>
                {/* Scroll interno para el texto */}
                <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                  {renderMarkdown(preview)}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity onPress={() => setShowDoc(true)} style={{ alignSelf: 'flex-start' }}>
              <Text style={styles.linkText}>Ver documento completo</Text>
            </TouchableOpacity>

            <View style={{ height: 16 }} />

            {/* Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreed(prev => !prev)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreed ? styles.checkboxChecked : null]}>
                {agreed ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
              </View>
              <TouchableOpacity onPress={() => setAgreed(prev => !prev)} style={styles.checkboxLabelWrap}>
                <Text style={styles.checkboxLabel}>He leído y acepto los términos y condiciones</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                <Text style={styles.buttonText}>RECHAZAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.acceptButton, !agreed && styles.acceptButtonDisabled]}
                onPress={() => { if (!agreed) return; handleAccept(); }}
                disabled={!agreed}
              >
                <Text style={styles.buttonText}>ACEPTAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal Pantalla Completa (Documento) */}
      <Modal visible={showDoc} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, styles.docContainer]}>
            <View style={styles.docHeader}>
              <Text style={styles.docTitle}>Términos y Condiciones</Text>
              <TouchableOpacity onPress={() => setShowDoc(false)}>
                <Text style={styles.closeDoc}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.docBody} contentContainerStyle={{ padding: 16 }}>
              {loading ? (
                <ActivityIndicator size="small" color="#003E85" />
              ) : (
                <View style={styles.docContent}>{renderMarkdown(termsText)}</View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  // Si se pasa como modal
  if (typeof visible === 'boolean') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        hardwareAccelerated
        onRequestClose={() => {
          if (!mandatory) handleReject();
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainerWrapper}>{content}</View>
        </View>
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' }, // Transparente para usar el backdrop del wrapper
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  innerContainer: { width: '100%', maxWidth: 900, alignItems: 'stretch' },

  // Wrapper del modal principal
  modalContainerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
    overflow: 'hidden'
  },

  headerBox: { backgroundColor: '#003E85', padding: 30, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { width: 64, height: 64, marginBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },

  termsBox: { backgroundColor: '#fff', padding: 24 },

  linkText: { color: '#003E85', fontWeight: '700', fontSize: 14, marginTop: 12, textDecorationLine: 'underline' },

  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 },
  rejectButton: { flex: 1, backgroundColor: '#E53935', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  acceptButton: { flex: 1, backgroundColor: '#003E85', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },

  // Documento completo
  modalContainer: { backgroundColor: '#fff', borderRadius: 12, width: '100%', maxWidth: 900 },
  docContainer: { width: '90%', height: '80%', backgroundColor: '#fff', maxWidth: 800 },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#EEE', backgroundColor: '#F9F9F9' },
  docTitle: { fontSize: 16, fontWeight: '700' },
  closeDoc: { color: '#003E85', fontWeight: '700' },
  docBody: { padding: 8 },
  docContent: { paddingBottom: 20 },

  /* Markdown styles */
  h1: { fontSize: 16, fontWeight: '700', marginBottom: 8, marginTop: 10 },
  h2: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  h3: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  h4: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  paragraph: { fontSize: 14, color: '#333', marginBottom: 8, lineHeight: 20 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  code: { fontFamily: Platform.OS === 'android' ? 'monospace' : 'Menlo', backgroundColor: '#F3F4F6', paddingHorizontal: 4, borderRadius: 4 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  listBullet: { width: 18, fontSize: 14, color: '#222' },
  listText: { flex: 1, fontSize: 14, color: '#222', lineHeight: 20 },

  previewContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    backgroundColor: '#FAFAFA'
  },

  // Checkbox
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#9CA3AF', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: '#003E85', borderColor: '#003E85' },
  checkboxLabelWrap: { marginLeft: 12, flex: 1 },
  checkboxLabel: { fontSize: 14, color: '#333' },

  acceptButtonDisabled: { backgroundColor: '#B0BEC5' },
});

export default TermsConditionsScreen;