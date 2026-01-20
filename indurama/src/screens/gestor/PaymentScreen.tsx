/**
 * PaymentScreen - Pantalla para que el Gestor registre pagos
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    TextInput,
    Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { Request, Quotation, RequestStatus } from '../../types';
import { theme } from '../../styles/theme';
import { useAuth } from '../../hooks/useAuth';
import * as DocumentPicker from 'expo-document-picker';
import { QuotationComments } from '../../components/QuotationComments';
import { useResponsive, BREAKPOINTS } from '../../styles/responsive';
import { ProcessHeader } from '../../components/ProcessHeader';

interface PaymentScreenProps {
    requestId: string;
    onBack: () => void;
    onPaymentComplete: () => void;
    currentUser?: any;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
    requestId,
    onBack,
    onPaymentComplete,
    currentUser,
}) => {
    const { user } = useAuth();
    const { width, isDesktopView } = useResponsive();

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [request, setRequest] = useState<Request | null>(null);
    const [quotation, setQuotation] = useState<Quotation | null>(null);
    const [showChatModal, setShowChatModal] = useState(false);

    // Payment Form State
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [proofFile, setProofFile] = useState<any>(null);

    // Responsive
    const containerMaxWidth = isDesktopView ? 1000 : undefined;

    useEffect(() => {
        loadData();
    }, [requestId]);

    const loadData = async () => {
        try {
            const reqDoc = await getDoc(doc(db, 'requests', requestId));
            if (!reqDoc.exists()) {
                Alert.alert('Error', 'Solicitud no encontrada');
                onBack();
                return;
            }
            const reqData = { id: reqDoc.id, ...reqDoc.data() } as Request;
            setRequest(reqData);

            if (reqData.selectedQuotationId || reqData.winnerQuotationId) {
                const qId = reqData.selectedQuotationId || reqData.winnerQuotationId;
                const quotDoc = await getDoc(doc(db, 'quotations', qId!));
                if (quotDoc.exists()) {
                    setQuotation({ id: quotDoc.id, ...quotDoc.data() } as Quotation);
                }
            }
        } catch (error) {
            console.error('Error loading payment data:', error);
            Alert.alert('Error', 'No se pudo cargar la información');
        } finally {
            setLoading(false);
        }
    };

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.assets && result.assets.length > 0) {
                setProofFile(result.assets[0]);
            }
        } catch (err) {
            console.error('Error picking document:', err);
        }
    };

    const handleRegisterPayment = async () => {
        if (!paymentReference.trim()) {
            Alert.alert('Error', 'Por favor ingrese el número de referencia del pago');
            return;
        }

        Alert.alert(
            'Confirmar Pago',
            '¿Está seguro de registrar este pago? Esta acción notificará al proveedor.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            setProcessing(true);
                            if (!request) return;

                            await updateDoc(doc(db, 'requests', request.id), {
                                paymentStatus: 'paid',
                                paymentReference,
                                paymentNotes,
                                paymentDate: serverTimestamp(),
                                status: RequestStatus.COMPLETED
                            });

                            Alert.alert('Éxito', 'Pago registrado correctamente');
                            onPaymentComplete();
                        } catch (error) {
                            console.error('Error registering payment:', error);
                            Alert.alert('Error', 'No se pudo registrar el pago');
                        } finally {
                            setProcessing(false);
                        }
                    }
                }
            ]
        );
    };

    const totalAmount = quotation ? (quotation.totalAmount * 1.15).toFixed(2) : '0.00';
    const subtotal = quotation?.totalAmount?.toFixed(2) || '0.00';
    const iva = quotation ? (quotation.totalAmount * 0.15).toFixed(2) : '0.00';

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Cargando información de pago...</Text>
            </View>
        );
    }

    if (!request) return null;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header consistente con otras pantallas */}
            <ProcessHeader
                title={request.code || 'REGISTRAR PAGO'}
                onBack={onBack}
                rightElement={
                    quotation?.supplierId ? (
                        <TouchableOpacity
                            style={styles.chatHeaderButton}
                            onPress={() => setShowChatModal(true)}
                        >
                            <Ionicons name="chatbubbles-outline" size={22} color={theme.colors.primary} />
                        </TouchableOpacity>
                    ) : undefined
                }
            />

            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{quotation?.supplierName || 'N/A'}</Text>
                    <Text style={styles.statLabel}>Proveedor</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>{'$'}{totalAmount}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: request.paymentStatus === 'paid' ? '#10B981' : '#F59E0B' }]}>
                        {request.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                    </Text>
                    <Text style={styles.statLabel}>Estado</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { maxWidth: containerMaxWidth, alignSelf: 'center', width: '100%' }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Layout Grid */}
                <View style={[styles.gridContainer, isDesktopView && styles.gridContainerDesktop]}>

                    {/* Left Column - Order Summary */}
                    <View style={[styles.column, isDesktopView && styles.columnLeft]}>
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
                                <Text style={styles.cardTitle}>Resumen de Orden</Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Solicitud</Text>
                                <Text style={styles.summaryValue}>{request.code || request.title}</Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Proveedor</Text>
                                <Text style={styles.summaryValue}>{quotation?.supplierName || 'N/A'}</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal</Text>
                                <Text style={styles.summaryValue}>{'$'}{subtotal}</Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>IVA (15%)</Text>
                                <Text style={styles.summaryValue}>{'$'}{iva}</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.summaryRow}>
                                <Text style={styles.totalLabel}>TOTAL</Text>
                                <Text style={styles.totalValue}>{'$'}{totalAmount}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Right Column - Status/Form */}
                    <View style={[styles.column, isDesktopView && styles.columnRight]}>
                        {!request.receivedAt && request.paymentStatus !== 'paid' ? (
                            /* Entrega Pendiente */
                            <View style={styles.warningCard}>
                                <View style={styles.warningHeader}>
                                    <View style={styles.warningIcon}>
                                        <Ionicons name="time-outline" size={24} color="#F59E0B" />
                                    </View>
                                    <View>
                                        <Text style={styles.warningTitle}>Entrega Pendiente</Text>
                                        <Text style={styles.warningSubtitle}>Validación requerida</Text>
                                    </View>
                                </View>
                                <Text style={styles.warningText}>
                                    El solicitante aún no ha validado la recepción de los bienes o servicios.
                                    No se puede registrar el pago hasta que exista conformidad.
                                </Text>

                                {/* Progress indicator */}
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressStep}>
                                        <View style={[styles.progressDot, styles.progressDotComplete]}>
                                            <Ionicons name="checkmark" size={12} color="#FFF" />
                                        </View>
                                        <Text style={styles.progressLabel}>Adjudicado</Text>
                                    </View>
                                    <View style={[styles.progressLine, styles.progressLineComplete]} />
                                    <View style={styles.progressStep}>
                                        <View style={[styles.progressDot, styles.progressDotActive]} />
                                        <Text style={[styles.progressLabel, styles.progressLabelActive]}>Entrega</Text>
                                    </View>
                                    <View style={styles.progressLine} />
                                    <View style={styles.progressStep}>
                                        <View style={styles.progressDot} />
                                        <Text style={styles.progressLabel}>Pago</Text>
                                    </View>
                                </View>
                            </View>
                        ) : request.paymentStatus === 'paid' ? (
                            /* Pago Completado */
                            <View style={styles.successCard}>
                                <View style={styles.successIcon}>
                                    <Ionicons name="checkmark-circle" size={56} color="#10B981" />
                                </View>
                                <Text style={styles.successTitle}>¡Pago Registrado!</Text>
                                <Text style={styles.successSubtitle}>La transacción ha sido completada</Text>

                                <View style={styles.successDetails}>
                                    <View style={styles.successDetailRow}>
                                        <Ionicons name="document-text-outline" size={18} color="#059669" />
                                        <Text style={styles.successDetailLabel}>Referencia:</Text>
                                        <Text style={styles.successDetailValue}>{request.paymentReference}</Text>
                                    </View>
                                    <View style={styles.successDetailRow}>
                                        <Ionicons name="calendar-outline" size={18} color="#059669" />
                                        <Text style={styles.successDetailLabel}>Fecha:</Text>
                                        <Text style={styles.successDetailValue}>
                                            {request.paymentDate ? new Date((request.paymentDate as any).seconds * 1000).toLocaleDateString() : '-'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            /* Formulario de Pago */
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
                                    <Text style={styles.cardTitle}>Información del Pago</Text>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Referencia / # Transacción *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={paymentReference}
                                        onChangeText={setPaymentReference}
                                        placeholder="Ej: TRX-123456789"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Notas Adicionales</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        value={paymentNotes}
                                        onChangeText={setPaymentNotes}
                                        placeholder="Comentarios sobre el pago..."
                                        placeholderTextColor="#9CA3AF"
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Comprobante (Opcional)</Text>
                                    <TouchableOpacity
                                        style={[styles.uploadButton, proofFile && styles.uploadButtonActive]}
                                        onPress={handlePickDocument}
                                    >
                                        <Ionicons
                                            name={proofFile ? "document-attach" : "cloud-upload-outline"}
                                            size={24}
                                            color={proofFile ? theme.colors.primary : "#9CA3AF"}
                                        />
                                        <Text style={[styles.uploadText, proofFile && styles.uploadTextActive]}>
                                            {proofFile ? proofFile.name : 'Seleccionar archivo'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            {request.paymentStatus !== 'paid' && request.receivedAt && (
                <View style={styles.bottomBar}>
                    <View style={styles.bottomBarContent}>
                        <View>
                            <Text style={styles.bottomBarLabel}>Total a pagar</Text>
                            <Text style={styles.bottomBarAmount}>{'$'}{totalAmount}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.payButton, processing && styles.payButtonDisabled]}
                            onPress={handleRegisterPayment}
                            disabled={processing}
                        >
                            {processing ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                    <Text style={styles.payButtonText}>Confirmar Pago</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Chat Modal */}
            <Modal
                visible={showChatModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowChatModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{quotation?.supplierName || 'Chat'}</Text>
                        <TouchableOpacity onPress={() => setShowChatModal(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
                        {quotation?.supplierId ? (
                            <QuotationComments
                                requestId={requestId}
                                supplierId={quotation.supplierId}
                                currentUserRole="gestor"
                                quotationId={quotation.id}
                                user={currentUser}
                            />
                        ) : (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text>No hay información del proveedor.</Text>
                            </View>
                        )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FB',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
        color: '#6B7280',
    },

    // Header
    chatHeaderButton: {
        padding: 8,
    },

    // Stats Bar
    statsBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 8,
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },

    // Grid
    gridContainer: {
        flexDirection: 'column',
    },
    gridContainerDesktop: {
        flexDirection: 'row',
        gap: 20,
    },
    column: {
        flex: 1,
    },
    columnLeft: {
        flex: 0.4,
    },
    columnRight: {
        flex: 0.6,
    },

    // Card
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },

    // Summary
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    summaryValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#10B981',
    },

    // Warning Card
    warningCard: {
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    warningIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    warningTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#92400E',
    },
    warningSubtitle: {
        fontSize: 13,
        color: '#B45309',
    },
    warningText: {
        fontSize: 14,
        color: '#78350F',
        lineHeight: 20,
        marginBottom: 16,
    },

    // Progress
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#FDE68A',
    },
    progressStep: {
        alignItems: 'center',
    },
    progressDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    progressDotComplete: {
        backgroundColor: '#10B981',
    },
    progressDotActive: {
        backgroundColor: '#F59E0B',
    },
    progressLine: {
        width: 40,
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 8,
        marginBottom: 16,
    },
    progressLineComplete: {
        backgroundColor: '#10B981',
    },
    progressLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    progressLabelActive: {
        color: '#F59E0B',
    },

    // Success Card
    successCard: {
        backgroundColor: '#ECFDF5',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    successIcon: {
        marginBottom: 12,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#065F46',
    },
    successSubtitle: {
        fontSize: 14,
        color: '#059669',
        marginTop: 4,
    },
    successDetails: {
        marginTop: 20,
        width: '100%',
    },
    successDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        gap: 8,
    },
    successDetailLabel: {
        fontSize: 14,
        color: '#047857',
    },
    successDetailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#065F46',
    },

    // Form
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 10,
        padding: 16,
        gap: 8,
    },
    uploadButtonActive: {
        backgroundColor: '#EFF6FF',
        borderColor: theme.colors.primary,
        borderStyle: 'solid',
    },
    uploadText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    uploadTextActive: {
        color: theme.colors.primary,
    },

    // Bottom Bar
    bottomBar: {
        backgroundColor: '#FFF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    bottomBarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 1000,
        alignSelf: 'center',
        width: '100%',
    },
    bottomBarLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    bottomBarAmount: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1F2937',
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    payButtonDisabled: {
        opacity: 0.6,
    },
    payButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },

    // Modal
    modalContainer: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
    },
});

export default PaymentScreen;
