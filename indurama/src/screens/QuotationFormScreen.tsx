/**
 * QuotationFormScreen - Formulario para que el Proveedor envíe su cotización
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { QuotationService } from '../services/quotationService';
import { Request, QuotationInvitation, Quotation } from '../types';
import { theme } from '../styles/theme';
import { QuotationComments } from '../components/QuotationComments';
import { useAuth } from '../hooks/useAuth';

interface QuotationFormScreenProps {
    invitationId: string;
    requestId: string;
    supplierId: string;
    supplierName: string;
    onNavigateBack: () => void;
    onSuccess?: () => void;
    onNavigateToPurchaseOrder?: (requestId: string, quotationId: string) => void;
}

export const QuotationFormScreen: React.FC<QuotationFormScreenProps> = ({
    invitationId,
    requestId,
    supplierId,
    supplierName,
    onNavigateBack,
    onSuccess,
    onNavigateToPurchaseOrder,
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [request, setRequest] = useState<Request | null>(null);
    const [invitation, setInvitation] = useState<QuotationInvitation | null>(null);
    const [existingQuotation, setExistingQuotation] = useState<Quotation | null>(null);

    // Form fields
    const [totalAmount, setTotalAmount] = useState('');
    const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');
    const [deliveryDays, setDeliveryDays] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [validityDays, setValidityDays] = useState('30');
    const [notes, setNotes] = useState('');

    const isReadOnly = existingQuotation?.status === 'selected' || existingQuotation?.isWinner || request?.status === 'awarded' || (request?.status as string) === 'adjudicado';

    useEffect(() => {
        loadData();
    }, [invitationId, requestId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Cargar solicitud
            const reqDoc = await getDoc(doc(db, 'requests', requestId));
            if (reqDoc.exists()) {
                setRequest({ id: reqDoc.id, ...reqDoc.data() } as Request);
            }

            // Cargar invitación
            const invDoc = await getDoc(doc(db, 'quotation_invitations', invitationId));
            if (invDoc.exists()) {
                const invData = { id: invDoc.id, ...invDoc.data() } as QuotationInvitation;
                setInvitation(invData);

                // Check for existing quotation
                if (invData.quotationId) {
                    const quotDoc = await getDoc(doc(db, 'quotations', invData.quotationId));
                    if (quotDoc.exists()) {
                        const quotData = { id: quotDoc.id, ...quotDoc.data() } as Quotation;
                        setExistingQuotation(quotData);

                        // Pre-fill form
                        if (quotData.status !== 'cancelled') {
                            setTotalAmount(quotData.totalAmount.toString());
                            setCurrency(quotData.currency);
                            setDeliveryDays(quotData.deliveryDays.toString());
                            setPaymentTerms(quotData.paymentTerms);
                            // Calculate validity days remaining or default? 
                            // Better to show original validity date or re-calculate days?
                            // Simple: just keep default '30' or try to reverse calc. 
                            // For now, let user re-enter or leave default.
                            if (quotData.notes) setNotes(quotData.notes);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'No se pudo cargar la información');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        if (!totalAmount || isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) {
            Alert.alert('Error', 'Ingresa un monto válido');
            return false;
        }
        if (!deliveryDays || isNaN(parseInt(deliveryDays)) || parseInt(deliveryDays) <= 0) {
            Alert.alert('Error', 'Ingresa días de entrega válidos');
            return false;
        }
        if (!paymentTerms.trim()) {
            Alert.alert('Error', 'Ingresa las condiciones de pago');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setSubmitting(true);

            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + parseInt(validityDays));

            const quotationData = {
                totalAmount: parseFloat(totalAmount),
                currency,
                deliveryDays: parseInt(deliveryDays),
                paymentTerms: paymentTerms.trim(),
                validUntil,
                notes: notes.trim() || undefined,
            };

            if (existingQuotation && existingQuotation.status !== 'cancelled') {
                await QuotationService.updateQuotation(existingQuotation.id, {
                    ...quotationData,
                    invitationId
                });
                Alert.alert('Éxito', 'Oferta actualizada correctamente', [
                    {
                        text: 'OK',
                        onPress: () => {
                            onSuccess?.();
                            onNavigateBack();
                        }
                    }
                ]);
            } else {
                await QuotationService.submitQuotation(
                    invitationId,
                    supplierId,
                    supplierName,
                    quotationData
                );
                Alert.alert('Éxito', 'Cotización enviada correctamente', [
                    {
                        text: 'OK',
                        onPress: () => {
                            onSuccess?.();
                            onNavigateBack();
                        }
                    }
                ]);
            }

        } catch (error: any) {
            console.error('Error submitting quotation:', error);
            Alert.alert('Error', error.message || 'No se pudo procesar la cotización');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelQuote = () => {
        Alert.alert(
            'Cancelar Offer',
            '¿Estás seguro de que deseas retirar esta oferta? Podrás enviar una nueva si el plazo no ha vencido.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, Cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setSubmitting(true);
                            if (existingQuotation) {
                                await QuotationService.cancelQuotation(existingQuotation.id, invitationId);
                                Alert.alert('Cancelada', 'La oferta ha sido retirada.', [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            onSuccess?.();
                                            onNavigateBack();
                                        }
                                    }
                                ]);
                            }
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo cancelar la oferta');
                        } finally {
                            setSubmitting(false);
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Sin fecha';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Cargando información...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>
                        {isReadOnly ? 'Detalle de Cotización' : (existingQuotation && existingQuotation.status !== 'cancelled' ? 'Editar Cotización' : 'Enviar Cotización')}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        #{requestId.slice(-6).toUpperCase()}
                    </Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Request Info */}
                    {request && (
                        <View style={styles.requestCard}>
                            <Text style={styles.sectionTitle}>Detalles de la Solicitud</Text>
                            <Text style={styles.requestDescription}>{request.description}</Text>
                            <View style={styles.requestMeta}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="business-outline" size={16} color="#666" />
                                    <Text style={styles.metaText}>{request.claseBusqueda || 'General'}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Ionicons name="folder-outline" size={16} color="#666" />
                                    <Text style={styles.metaText}>{request.tipoProyecto || 'N/A'}</Text>
                                </View>
                            </View>
                            {invitation?.dueDate && (
                                <View style={styles.dueDateBox}>
                                    <Ionicons name="time-outline" size={16} color="#F44336" />
                                    <Text style={styles.dueDateText}>
                                        Fecha límite: {formatDate(invitation.dueDate)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Status Info Banner */}
                    {existingQuotation && (
                        <>
                            {existingQuotation.status === 'submitted' && (
                                <View style={styles.infoBanner}>
                                    <Ionicons name="information-circle" size={24} color="#2196F3" />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoBannerTitle}>Oferta Enviada</Text>
                                        <Text style={styles.infoBannerText}>
                                            Tu cotización ha sido enviada al gestor. Puedes modificarla mientras la solicitud siga abierta.
                                            Utiliza el chat abajo para cualquier consulta adicional.
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {(existingQuotation.status === 'selected' || existingQuotation.isWinner) && (
                                <View style={[styles.infoBanner, { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' }]}>
                                    <Ionicons name="trophy" size={24} color="#4CAF50" />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.infoBannerTitle, { color: '#2E7D32' }]}>¡Felicitaciones! Ganaste</Text>
                                        <Text style={[styles.infoBannerText, { color: '#388E3C' }]}>
                                            Tu oferta ha sido seleccionada. Por favor revisa la Orden de Compra para proceder con la entrega.
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.viewPoButton}
                                            onPress={() => onNavigateToPurchaseOrder?.(requestId, existingQuotation.id)}
                                        >
                                            <Ionicons name="document-text" size={20} color="#FFF" />
                                            <Text style={styles.viewPoButtonText}>Ver Orden de Compra</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </>
                    )}

                    {/* Form */}
                    <View style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Tu Oferta</Text>

                        {/* Amount */}
                        <Text style={styles.label}>Monto Total *</Text>
                        <View style={styles.amountRow}>
                            <TextInput
                                style={styles.amountInput}
                                value={totalAmount}
                                onChangeText={setTotalAmount}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                                editable={!isReadOnly}
                            />
                            <View style={[styles.currencySelector, isReadOnly && { opacity: 0.7 }]}>
                                <TouchableOpacity
                                    style={[styles.currencyOption, currency === 'USD' && styles.currencyOptionActive]}
                                    onPress={() => !isReadOnly && setCurrency('USD')}
                                    disabled={isReadOnly}
                                >
                                    <Text style={[styles.currencyText, currency === 'USD' && styles.currencyTextActive]}>USD</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.currencyOption, currency === 'EUR' && styles.currencyOptionActive]}
                                    onPress={() => !isReadOnly && setCurrency('EUR')}
                                    disabled={isReadOnly}
                                >
                                    <Text style={[styles.currencyText, currency === 'EUR' && styles.currencyTextActive]}>EUR</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Delivery Days */}
                        <Text style={styles.label}>Tiempo de Entrega *</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.smallInput}
                                value={deliveryDays}
                                onChangeText={setDeliveryDays}
                                placeholder="0"
                                keyboardType="number-pad"
                                maxLength={3}
                                editable={!isReadOnly}
                            />
                            <Text style={styles.inputSuffix}>días hábiles</Text>
                        </View>

                        {/* Payment Terms */}
                        <Text style={styles.label}>Condiciones de Pago *</Text>
                        <TextInput
                            style={styles.input}
                            value={paymentTerms}
                            onChangeText={setPaymentTerms}
                            placeholder="Ej: 30 días crédito, 50% anticipo, etc."
                            editable={!isReadOnly}
                        />

                        {/* Validity */}
                        <Text style={styles.label}>Vigencia de la Oferta</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.smallInput}
                                value={validityDays}
                                onChangeText={setValidityDays}
                                placeholder="30"
                                keyboardType="number-pad"
                                maxLength={3}
                                editable={!isReadOnly}
                            />
                            <Text style={styles.inputSuffix}>días</Text>
                        </View>

                        {/* Notes */}
                        <Text style={styles.label}>Observaciones (opcional)</Text>
                        <TextInput
                            style={styles.textArea}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Incluye cualquier información adicional..."
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            editable={!isReadOnly}
                        />
                    </View>

                    {/* Q&A Section */}
                    {invitation && user && (
                        <View style={[styles.formCard, { marginTop: 16 }]}>
                            <Text style={styles.sectionTitle}>Preguntas y Comentarios</Text>
                            <Text style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
                                Utiliza este espacio para aclarar dudas con el gestor.
                            </Text>
                            <QuotationComments
                                requestId={requestId}
                                supplierId={supplierId}
                                currentUserRole="proveedor"
                                quotationId={existingQuotation?.id}
                            />
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Footer - Only show actions if NOT read only */}
                {!isReadOnly && (
                    <View style={styles.footer}>
                        {existingQuotation && existingQuotation.status !== 'cancelled' && (
                            <TouchableOpacity
                                style={[styles.cancelButton, { marginBottom: 10 }]}
                                onPress={handleCancelQuote}
                                disabled={submitting}
                            >
                                <Text style={styles.cancelButtonText}>Retirar Oferta</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="send" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.submitButtonText}>
                                        {existingQuotation && existingQuotation.status !== 'cancelled' ? 'Actualizar Oferta' : 'Enviar Cotización'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: '#666',
    },
    header: {
        backgroundColor: theme.colors.primary,
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
    },
    headerCenter: {
        flex: 1,
        marginLeft: 8,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    requestCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    requestDescription: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
        marginBottom: 12,
    },
    requestMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        color: '#666',
    },
    dueDateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        padding: 10,
        backgroundColor: '#FFF3E0',
        borderRadius: 8,
    },
    dueDateText: {
        fontSize: 13,
        color: '#F44336',
        fontWeight: '500',
    },
    formCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        backgroundColor: '#FAFAFA',
    },
    amountRow: {
        flexDirection: 'row',
        gap: 12,
    },
    amountInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 10,
        padding: 14,
        fontSize: 20,
        fontWeight: 'bold',
        backgroundColor: '#FAFAFA',
    },
    currencySelector: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 10,
        overflow: 'hidden',
    },
    currencyOption: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FAFAFA',
    },
    currencyOptionActive: {
        backgroundColor: theme.colors.primary,
    },
    currencyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    currencyTextActive: {
        color: '#FFF',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    smallInput: {
        width: 80,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 10,
        padding: 14,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#FAFAFA',
    },
    inputSuffix: {
        fontSize: 14,
        color: '#666',
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        backgroundColor: '#FAFAFA',
        minHeight: 100,
    },
    footer: {
        backgroundColor: '#FFF',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F44336',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#F44336',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoBanner: {
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#90CAF9',
    },
    infoBannerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0D47A1',
        marginBottom: 4,
    },
    infoBannerText: {
        fontSize: 13,
        color: '#1565C0',
        lineHeight: 18,
    },
    viewPoButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 12,
        alignSelf: 'flex-start',
        gap: 8,
    },
    viewPoButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default QuotationFormScreen;
