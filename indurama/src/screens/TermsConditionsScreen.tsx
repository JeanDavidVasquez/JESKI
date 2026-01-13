import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Cargamos el documento en tiempo de ejecución desde `src/documents/terms/termsText.ts` para evitar problemas de resolución estática

export const TermsConditionsScreen: React.FC<{
  visible?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  mandatory?: boolean;
}> = ({ visible, onAccept, onReject, mandatory = false }) => {
  const handleAccept = async () => {
    await AsyncStorage.setItem('termsAccepted', '1');
    onAccept?.();
  };

  const handleReject = async () => {
    // opcional: marcar explícitamente como no aceptado
    await AsyncStorage.removeItem('termsAccepted');
    onReject?.();
  };

  const [termsText, setTermsText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showDoc, setShowDoc] = useState<boolean>(false);
  const [agreed, setAgreed] = useState<boolean>(false);

  const loadTermsFromFile = async () => {
    setLoading(true);
    let loadedText = '';

    // Intentar cargar desde termsText.ts (Prioridad 1: Más estable)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fallback = require('../documents/terms/termsText').TERMS_TEXT as string;
      if (fallback) {
        setTermsText(fallback);
        setLoading(false);
        return;
      }
    } catch (fbErr) {
      console.warn('No se pudo cargar termsText.ts:', fbErr);
    }

    // Intentar cargar desde terms.md (Prioridad 2)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mdModule = require('../documents/terms/terms.md');
      if (mdModule && typeof mdModule === 'string') {
        const res = await fetch(mdModule);
        loadedText = await res.text();
        setTermsText(loadedText);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('No se pudo cargar terms.md:', e);
    }

    if (!loadedText) {
      setTermsText('No se pudo cargar el documento de términos.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTermsFromFile();
  }, []);

  // Mini-renderer Markdown (simple, seguro y sin dependencias)
  const renderInline = (text: string) => {
    if (!text) return null;
    // Soporta **negrita**, *cursiva* y `code`
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
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.innerContainer}>
          <View style={styles.headerBox}>
            {/* Close Button only when used as modal */}
            {typeof visible === 'boolean' && (
              <TouchableOpacity
                style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}
                onPress={() => onReject?.()}
              >
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            )}

            <Image source={require('../../assets/icons/terms.png')} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>TÉRMINOS Y CONDICIONES</Text>
          </View>
          <View style={styles.termsBox}>
            {loading ? (
              <ActivityIndicator size="small" color="#003E85" style={{ marginVertical: 8 }} />
            ) : (
              <View style={styles.previewContainer}>{renderMarkdown(preview)}</View>
            )}

            <TouchableOpacity onPress={() => setShowDoc(true)}>
              <Text style={styles.linkText}>Ver más</Text>
            </TouchableOpacity>

            <View style={{ height: 8 }} />

            {/* Checkbox: el usuario debe marcar para habilitar ACEPTAR */}
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={[styles.checkbox, agreed ? styles.checkboxChecked : null]}
                onPress={() => setAgreed(prev => !prev)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreed }}
                accessibilityLabel="He leído y acepto los términos y condiciones"
              >
                {agreed ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAgreed(prev => !prev)} style={styles.checkboxLabelWrap}>
                <Text style={styles.checkboxLabel}>He leído y acepto los términos y condiciones</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                <Text style={styles.buttonText}>RECHAZAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.acceptButton, !agreed && styles.acceptButtonDisabled]}
                onPress={() => { if (!agreed) return; handleAccept(); }}
                accessibilityState={{ disabled: !agreed }}
                disabled={!agreed}
              >
                <Text style={styles.buttonText}>ACEPTAR</Text>
              </TouchableOpacity>
            </View> 
          </View>
        </View>
      </ScrollView>

      {/* Modal para ver el documento completo */}
      <Modal visible={showDoc} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, styles.docContainer]}>
            <View style={styles.docHeader}>
              <Text style={styles.docTitle}>Términos y Condiciones (Documento)</Text>
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

  // Si se pasa prop visible -> renderizamos como Modal, sino como pantalla normal
  if (typeof visible === 'boolean') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        hardwareAccelerated
        onRequestClose={() => {
          if (!mandatory) handleReject();
          // si es mandatory, ignoramos el back
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>{content}</View>
        </View>
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  innerContainer: { width: '100%', maxWidth: 900, alignItems: 'stretch', paddingHorizontal: 12 },
  headerBox: { backgroundColor: '#003E85', borderRadius: 24, padding: 24, paddingTop: 36, alignItems: 'center', marginBottom: 24 },
  headerIcon: { width: 64, height: 64, marginBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  termsBox: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#E5E7EB', padding: 24, marginBottom: 24, width: '100%' },
  termsText: { color: '#222', fontSize: 15, marginBottom: 16 },
  linkText: { color: '#003E85', fontWeight: '700', fontSize: 15, marginTop: 12, alignSelf: 'flex-start' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rejectButton: { backgroundColor: '#E53935', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginRight: 8 },
  acceptButton: { backgroundColor: '#003E85', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginLeft: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // estilos modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 12, maxHeight: '90%', overflow: 'hidden', width: '100%', maxWidth: 900, alignSelf: 'center' },

  // Documento completo
  docContainer: { width: '100%', maxWidth: 900, alignSelf: 'center', height: '80%' },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#EEE' },
  docTitle: { fontSize: 16, fontWeight: '700' },
  closeDoc: { color: '#003E85', fontWeight: '700' },
  docBody: { padding: 8 },
  docText: { fontSize: 14, color: '#222', lineHeight: 20 },

  /* Markdown styles */
  h1: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  h2: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  h3: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  h4: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  paragraph: { fontSize: 14, color: '#222', marginBottom: 8, lineHeight: 20 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  code: { fontFamily: Platform.OS === 'android' ? 'monospace' : 'Menlo', backgroundColor: '#F3F4F6', paddingHorizontal: 4, borderRadius: 4 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  listBullet: { width: 18, fontSize: 14, color: '#222' },
  listText: { flex: 1, fontSize: 14, color: '#222', lineHeight: 20 },
  previewContainer: { maxHeight: 140, overflow: 'hidden', marginTop: 6 },
  docContent: { paddingBottom: 20 },

  // Checkbox
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 6 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: '#9CA3AF', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: '#003E85', borderColor: '#003E85' },
  checkboxLabelWrap: { marginLeft: 12, flex: 1 },
  checkboxLabel: { fontSize: 14, color: '#333' },

  acceptButtonDisabled: { backgroundColor: '#9CA3AF', opacity: 0.7 },
});

export default TermsConditionsScreen;