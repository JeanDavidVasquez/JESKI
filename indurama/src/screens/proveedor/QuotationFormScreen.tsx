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
    useWindowDimensions,
    Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { QuotationService } from '../../services/quotationService';
import { Request, QuotationInvitation, Quotation } from '../../types';
import { theme } from '../../styles/theme';
import { QuotationComments } from '../../components/QuotationComments';
import { useAuth } from '../../hooks/useAuth';

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
    const { width } = useWindowDimensions();
    const isMobile = width < 900;

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

    // --- NUEVO ESTADO PARA LA FECHA ESTIMADA ---
    const [estimatedDate, setEstimatedDate] = useState<string | null>(null);

    const isReadOnly = existingQuotation?.status === 'selected' || existingQuotation?.isWinner || request?.status === 'awarded' || (request?.status as string) === 'adjudicado';

    useEffect(() => {
        loadData();
    }, [invitationId, requestId]);

    // --- LÓGICA DE CÁLCULO DE DÍAS HÁBILES ---
    useEffect(() => {
        const days = parseInt(deliveryDays, 10);
        if (!isNaN(days) && days > 0) {
            const date = calculateBusinessDate(days);
            // Formatear: "Lunes, 12 de febrero de 2026"
            const dateStr = date.toLocaleDateString('es-EC', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            // Capitalizar primera letra
            setEstimatedDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
        } else {
            setEstimatedDate(null);
        }
    }, [deliveryDays]);

    const calculateBusinessDate = (daysToAdd: number) => {
        let currentDate = new Date();
        let addedDays = 0;

        while (addedDays < daysToAdd) {
            currentDate.setDate(currentDate.getDate() + 1);
            const day = currentDate.getDay(); // 0 = Domingo, 6 = Sábado

            // Si NO es fin de semana, contamos el día
            if (day !== 0 && day !== 6) {
                addedDays++;
            }
        }
        return currentDate;
    };
    // ------------------------------------------

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
        if (!validityDays || isNaN(parseInt(validityDays)) || parseInt(validityDays) <= 0) {
            Alert.alert('Error', 'Ingresa una vigencia de oferta válida');
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
                notes: notes.trim() || '',
            };

            if (existingQuotation && existingQuotation.status !== 'cancelled') {
                await QuotationService.updateQuotation(existingQuotation.id, {
                    ...quotationData,
                    invitationId
                });
            } else {
                await QuotationService.submitQuotation(
                    invitationId,
                    supplierId,
                    supplierName,
                    quotationData
                );
            }

            const successMessage = existingQuotation ? 'Oferta actualizada correctamente' : 'Cotización enviada correctamente';

            if (Platform.OS === 'web') {
                window.alert(`Éxito: ${successMessage}`);
                if (onSuccess) onSuccess();
                onNavigateBack();
            } else {
                Alert.alert('Éxito', successMessage, [
                    {
                        text: 'OK',
                        onPress: () => {
                            if (onSuccess) onSuccess();
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
            '¿Estás seguro de que deseas retirar esta oferta?',
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
                <View style={[styles.headerContent, !isMobile && { maxWidth: 1200, alignSelf: 'center', width: '100%' }]}>
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
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingBottom: 100,
                        alignItems: 'center'
                    }}
                >
                    <View style={[styles.mainLayout, !isMobile && styles.mainLayoutWeb]}>

                        {/* Left Column: Request Details */}
                        <View style={[styles.column, !isMobile && styles.leftColumn]}>
                            {request && (
                                <View style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
                                        <Text style={styles.cardTitle}>Detalles de la Solicitud</Text>
                                    </View>

                                    <Text style={styles.requestDescription}>{request.description}</Text>

                                    <View style={styles.divider} />

                                    <View style={styles.metaGrid}>
                                        <View style={styles.metaItem}>
                                            <Text style={styles.metaLabel}>Categoría</Text>
                                            <View style={styles.metaValueRow}>
                                                <Ionicons name="business-outline" size={14} color="#666" />
                                                <Text style={styles.metaValue}>{request.claseBusqueda || 'General'}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <Text style={styles.metaLabel}>Tipo</Text>
                                            <View style={styles.metaValueRow}>
                                                <Ionicons name="folder-open-outline" size={14} color="#666" />
                                                <Text style={styles.metaValue}>{request.tipoProyecto || 'N/A'}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {invitation?.dueDate && (
                                        <View style={styles.dueDateContainer}>
                                            <View style={styles.dueDateIconBg}>
                                                <Ionicons name="timer-outline" size={20} color="#D97706" />
                                            </View>
                                            <View>
                                                <Text style={styles.dueDateLabel}>Fecha límite</Text>
                                                <Text style={styles.dueDateValue}>
                                                    {formatDate(invitation.dueDate)}
                                                </Text>
                                            </View>
                                        </View>
                                    )}

                                    {((request?.documents && request.documents.length > 0) || (request?.attachments && request.attachments.length > 0)) && (
                                        <View style={styles.documentsContainer}>
                                            <Text style={styles.documentsTitle}>Documentos Adjuntos</Text>
                                            {request.documents?.map((doc, index) => (
                                                <TouchableOpacity
                                                    key={`doc-${index}`}
                                                    style={styles.documentItem}
                                                    onPress={() => Linking.openURL(doc.url)}
                                                >
                                                    <View style={styles.docIcon}>
                                                        <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                                                        <Text style={styles.docType}>Click para ver archivo</Text>
                                                    </View>
                                                    <Ionicons name="open-outline" size={20} color="#6B7280" />
                                                </TouchableOpacity>
                                            ))}
                                            {request.attachments?.map((url, index) => (
                                                <TouchableOpacity
                                                    key={`att-${index}`}
                                                    style={styles.documentItem}
                                                    onPress={() => Linking.openURL(url)}
                                                >
                                                    <View style={styles.docIcon}>
                                                        <Ionicons name="link-outline" size={24} color={theme.colors.secondary} />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.docName} numberOfLines={1}>Documento Adjunto {index + 1}</Text>
                                                        <Text style={styles.docType}>External Link</Text>
                                                    </View>
                                                    <Ionicons name="open-outline" size={20} color="#6B7280" />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}

                            {invitation && user && (
                                <View style={[styles.card, { marginTop: 16 }]}>
                                    <View style={styles.cardHeader}>
                                        <Ionicons name="chatbubbles-outline" size={20} color={theme.colors.primary} />
                                        <Text style={styles.cardTitle}>Preguntas y Comentarios</Text>
                                    </View>
                                    <Text style={styles.helperText}>
                                        Utiliza este espacio para aclarar dudas con el gestor antes de enviar tu oferta.
                                    </Text>
                                    <QuotationComments
                                        requestId={requestId}
                                        supplierId={supplierId}
                                        currentUserRole="proveedor"
                                        quotationId={existingQuotation?.id}
                                    />
                                </View>
                            )}
                        </View>

                        {/* Right Column: Quotation Form & Banners */}
                        <View style={[styles.column, !isMobile && styles.rightColumn]}>

                            {existingQuotation && (
                                <View style={{ marginBottom: 16 }}>
                                    {(existingQuotation.status === 'selected' || existingQuotation.isWinner) && (
                                        <View style={styles.winnerBanner}>
                                            <View style={styles.bannerHeader}>
                                                <Ionicons name="trophy" size={24} color="#15803D" />
                                                <Text style={styles.winnerTitle}>¡Felicitaciones! Ganaste</Text>
                                            </View>
                                            <Text style={styles.winnerText}>
                                                Tu oferta ha sido seleccionada. Por favor revisa la Orden de Compra para proceder.
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.poButton}
                                                onPress={() => onNavigateToPurchaseOrder?.(requestId, existingQuotation.id)}
                                            >
                                                <Text style={styles.poButtonText}>Ver Orden de Compra</Text>
                                                <Ionicons name="arrow-forward" size={16} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {request?.paymentStatus === 'paid' && (
                                        <View style={styles.paymentBanner}>
                                            <View style={styles.bannerHeader}>
                                                <Ionicons name="checkmark-circle" size={24} color="#059669" />
                                                <Text style={styles.paymentTitle}>Pago Registrado</Text>
                                            </View>
                                            <View style={styles.paymentDetails}>
                                                <Text style={styles.paymentLabel}>Referencia:</Text>
                                                <Text style={styles.paymentValue}>{request.paymentReference}</Text>
                                            </View>
                                            {request.paymentDate && (
                                                <View style={styles.paymentDetails}>
                                                    <Text style={styles.paymentLabel}>Fecha:</Text>
                                                    <Text style={styles.paymentValue}>
                                                        {request.paymentDate?.toDate
                                                            ? request.paymentDate.toDate().toLocaleDateString('es-EC')
                                                            : new Date(request.paymentDate).toLocaleDateString('es-EC')}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {existingQuotation.status === 'submitted' && !existingQuotation.isWinner && (
                                        <View style={styles.infoBanner}>
                                            <Ionicons name="information-circle" size={20} color="#2563EB" />
                                            <Text style={styles.infoText}>
                                                Tu oferta ha sido enviada. Te notificaremos cuando el gestor tome una decisión.
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Quotation Form Card */}
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Ionicons name="pricetag-outline" size={20} color={theme.colors.primary} />
                                    <Text style={styles.cardTitle}>Tu Oferta Comercial</Text>
                                </View>

                                {/* Amount Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Monto Total *</Text>
                                    <View style={[styles.amountInputContainer, isReadOnly && styles.readOnlyInput]}>
                                        <Ionicons name="cash-outline" size={20} color="#9CA3AF" style={{ marginLeft: 12 }} />
                                        <TextInput
                                            style={styles.amountInput}
                                            value={totalAmount}
                                            onChangeText={setTotalAmount}
                                            placeholder="0.00"
                                            placeholderTextColor="#9CA3AF"
                                            keyboardType="decimal-pad"
                                            editable={!isReadOnly}
                                        />
                                        <View style={styles.currencyToggle}>
                                            <TouchableOpacity
                                                style={[styles.currencyBtn, currency === 'USD' && styles.currencyBtnActive]}
                                                onPress={() => !isReadOnly && setCurrency('USD')}
                                                disabled={isReadOnly}
                                            >
                                                <Text style={[styles.currencyBtnText, currency === 'USD' && { color: '#FFF' }]}>USD</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.currencyBtn, currency === 'EUR' && styles.currencyBtnActive]}
                                                onPress={() => !isReadOnly && setCurrency('EUR')}
                                                disabled={isReadOnly}
                                            >
                                                <Text style={[styles.currencyBtnText, currency === 'EUR' && { color: '#FFF' }]}>EUR</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                {/* Delivery & Validity Row */}
                                <View style={styles.rowInputs}>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.label}>Tiempo de Entrega *</Text>
                                        <View style={[styles.suffixInputContainer, isReadOnly && styles.readOnlyInput]}>
                                            <TextInput
                                                style={styles.inputFlex}
                                                value={deliveryDays}
                                                onChangeText={setDeliveryDays}
                                                placeholder="0"
                                                keyboardType="number-pad"
                                                editable={!isReadOnly}
                                            />
                                            <Text style={styles.inputSuffix}>días hábiles</Text>
                                        </View>
                                        {/* AQUI SE MUESTRA LA FECHA ESTIMADA CALCULADA */}
                                        {estimatedDate && !isReadOnly && (
                                            <View style={styles.estimateContainer}>
                                                <Ionicons name="calendar-outline" size={12} color="#059669" />
                                                <Text style={styles.estimateText}>
                                                    Entrega aprox: <Text style={styles.estimateDate}>{estimatedDate}</Text>
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.label}>Vigencia Oferta</Text>
                                        <View style={[styles.suffixInputContainer, isReadOnly && styles.readOnlyInput]}>
                                            <TextInput
                                                style={styles.inputFlex}
                                                value={validityDays}
                                                onChangeText={setValidityDays}
                                                placeholder="30"
                                                keyboardType="number-pad"
                                                editable={!isReadOnly}
                                            />
                                            <Text style={styles.inputSuffix}>días</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Payment Terms */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Condiciones de Pago *</Text>
                                    <TextInput
                                        style={[styles.standardInput, isReadOnly && styles.readOnlyInput]}
                                        value={paymentTerms}
                                        onChangeText={setPaymentTerms}
                                        placeholder="Ej: 30 días crédito, 50% anticipo"
                                        editable={!isReadOnly}
                                    />
                                </View>

                                {/* Notes */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Observaciones (opcional)</Text>
                                    <TextInput
                                        style={[styles.textArea, isReadOnly && styles.readOnlyInput]}
                                        value={notes}
                                        onChangeText={setNotes}
                                        placeholder="Información adicional relevante..."
                                        multiline
                                        numberOfLines={4}
                                        textAlignVertical="top"
                                        editable={!isReadOnly}
                                    />
                                </View>
                            </View>

                            {/* Actions Footer */}
                            {!isReadOnly && (
                                <View style={styles.actionButtonsContainer}>
                                    {existingQuotation && existingQuotation.status !== 'cancelled' && (
                                        <TouchableOpacity
                                            style={styles.cancelLink}
                                            onPress={handleCancelQuote}
                                            disabled={submitting}
                                        >
                                            <Text style={styles.cancelLinkText}>Retirar Oferta</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.submitButton, submitting && styles.btnDisabled]}
                                        onPress={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <>
                                                <Text style={styles.submitButtonText}>
                                                    {existingQuotation && existingQuotation.status !== 'cancelled' ? 'Actualizar Oferta' : 'Enviar Cotización'}
                                                </Text>
                                                <Ionicons name="send" size={18} color="#FFF" />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: theme.colors.text.secondary,
    },
    header: {
        backgroundColor: theme.colors.primary,
        paddingTop: Platform.OS === 'ios' ? 50 : 0,
        width: '100%',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerCenter: {
        flex: 1,
    },
    headerTitle: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
    },
    content: {
        flex: 1,
    },
    mainLayout: {
        width: '100%',
        padding: 16,
        maxWidth: 500, // Mobile default constraint
        alignSelf: 'center',
    },
    mainLayoutWeb: {
        flexDirection: 'row',
        maxWidth: 1200,
        gap: 24,
        alignItems: 'flex-start',
    },
    column: {
        flex: 1,
        width: '100%',
    },
    leftColumn: {
        flex: 0.4,
    },
    rightColumn: {
        flex: 0.6,
    },
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 16,
    },
    requestDescription: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 24,
    },
    metaGrid: {
        flexDirection: 'row',
        gap: 24,
    },
    metaItem: {
        gap: 4,
    },
    metaLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    metaValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
    },
    dueDateContainer: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFF7ED',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    dueDateIconBg: {
        backgroundColor: '#FFF',
        padding: 8,
        borderRadius: 8,
    },
    dueDateLabel: {
        fontSize: 12,
        color: '#9A3412',
    },
    dueDateValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#C2410C',
    },
    helperText: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 16,
        lineHeight: 20,
    },
    winnerBanner: {
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        marginBottom: 16,
    },
    paymentBanner: {
        backgroundColor: '#ECFDF5',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        marginBottom: 16,
    },
    infoBanner: {
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    bannerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    winnerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#15803D',
    },
    winnerText: {
        fontSize: 14,
        color: '#166534',
        marginBottom: 16,
        lineHeight: 20,
    },
    paymentTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#065F46',
    },
    paymentDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    paymentLabel: {
        color: '#047857',
        fontSize: 14,
    },
    paymentValue: {
        color: '#064E3B',
        fontWeight: '600',
        fontSize: 14,
    },
    infoText: {
        fontSize: 14,
        color: '#1E40AF',
        flex: 1,
        lineHeight: 20,
    },
    poButton: {
        backgroundColor: '#15803D',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        gap: 8,
    },
    poButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        height: 56,
    },
    amountInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        paddingHorizontal: 12,
    },
    currencyToggle: {
        flexDirection: 'row',
        marginRight: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
        padding: 2,
    },
    currencyBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    currencyBtnActive: {
        backgroundColor: theme.colors.primary,
    },
    currencyBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 16,
    },
    suffixInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 12,
        backgroundColor: '#F9FAFB',
        height: 50,
    },
    inputFlex: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
    },
    inputSuffix: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 8,
    },
    standardInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        fontSize: 15,
        backgroundColor: '#F9FAFB',
        color: '#111827',
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        backgroundColor: '#F9FAFB',
        color: '#111827',
        minHeight: 120,
    },
    readOnlyInput: {
        backgroundColor: '#F3F4F6',
        borderColor: 'transparent',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    submitButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        height: 56,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    btnDisabled: {
        opacity: 0.7,
    },
    cancelLink: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    cancelLinkText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '500',
    },
    documentsContainer: {
        marginTop: 24,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    documentsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    docIcon: {
        marginRight: 12,
        backgroundColor: '#FFF',
        padding: 8,
        borderRadius: 8,
    },
    docName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 2,
    },
    docType: {
        fontSize: 12,
        color: '#6B7280',
    },
    // --- ESTILOS PARA FECHA ESTIMADA ---
    estimateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        backgroundColor: '#ECFDF5',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        gap: 6
    },
    estimateText: {
        fontSize: 12,
        color: '#047857',
    },
    estimateDate: {
        fontWeight: '700',
    }
});

export default QuotationFormScreen;