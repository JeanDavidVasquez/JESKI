import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { Request, Quotation, QuotationInvitation } from '../types';
import { theme } from '../styles/theme';
import { useAuth } from '../hooks/useAuth';

interface PurchaseOrderScreenProps {
    requestId: string;
    quotationId: string;
    onBack: () => void;
}

export const PurchaseOrderScreen: React.FC<PurchaseOrderScreenProps> = ({
    requestId,
    quotationId,
    onBack
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState<Request | null>(null);
    const [quotation, setQuotation] = useState<Quotation | null>(null);
    const [invitation, setInvitation] = useState<QuotationInvitation | null>(null);

    useEffect(() => {
        loadData();
    }, [requestId, quotationId]);

    const loadData = async () => {
        try {
            // 1. Load Request
            const reqDoc = await getDoc(doc(db, 'requests', requestId));
            if (!reqDoc.exists()) {
                Alert.alert('Error', 'Solicitud no encontrada');
                onBack();
                return;
            }
            const reqData = { id: reqDoc.id, ...reqDoc.data() } as Request;
            setRequest(reqData);

            // 2. Load Quotation
            const quotDoc = await getDoc(doc(db, 'quotations', quotationId));
            if (!quotDoc.exists()) {
                Alert.alert('Error', 'Cotización no encontrada');
                return;
            }
            const quotData = { id: quotDoc.id, ...quotDoc.data() } as Quotation;
            setQuotation(quotData);

            // 3. Load Invitation (for delivery address)
            if (quotData.invitationId) {
                const invDoc = await getDoc(doc(db, 'quotation_invitations', quotData.invitationId));
                if (invDoc.exists()) {
                    setInvitation({ id: invDoc.id, ...invDoc.data() } as QuotationInvitation);
                }
            }

        } catch (error) {
            console.error('Error loading PO data:', error);
            Alert.alert('Error', 'No se pudo cargar la orden de compra');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        // Here we would use expo-print to generate PDF
        Alert.alert('Generar PDF', 'Funcionalidad de impresión en desarrollo. Se generará el PDF de la Orden de Compra.');
    };

    if (loading || !request || !quotation) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const subtotal = quotation.totalAmount;
    const vat = subtotal * 0.15; // 15% IVA Mock
    const total = subtotal + vat;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Orden de Compra</Text>
                <TouchableOpacity onPress={handlePrint} style={styles.printButton}>
                    <Ionicons name="print-outline" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Document Paper */}
                <View style={styles.paper}>
                    {/* Brand Header */}
                    <View style={styles.paperHeader}>
                        <View>
                            <Text style={styles.brandName}>INDURAMA</Text>
                            <Text style={styles.brandSub}>Electrodomésticos del Ecuador S.A.</Text>
                            <Text style={styles.companyInfo}>RUC: 0190045678001</Text>
                            <Text style={styles.companyInfo}>Cuenca, Ecuador</Text>
                        </View>
                        <View style={styles.poNumberBox}>
                            <Text style={styles.poLabel}>ORDEN DE COMPRA</Text>
                            <Text style={styles.poNumber}>#{request.code || requestId.slice(-6).toUpperCase()}</Text>
                            <Text style={styles.poDate}>{new Date().toLocaleDateString()}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Parties */}
                    <View style={styles.row}>
                        <View style={[styles.column, { marginRight: 16 }]}>
                            <Text style={styles.sectionLabel}>PROVEEDOR:</Text>
                            <Text style={styles.partyName}>{quotation.supplierName}</Text>
                            <Text style={styles.partyDetail}>ID: {quotation.supplierId.slice(0, 8)}</Text>
                            <Text style={styles.partyDetail}>Términos: {quotation.paymentTerms}</Text>
                        </View>
                        <View style={styles.column}>
                            <Text style={styles.sectionLabel}>ENVIAR A:</Text>
                            <Text style={styles.partyName}>Indurama Planta Industrial</Text>
                            <Text style={styles.partyDetail}>
                                {invitation?.deliveryAddress || request.deliveryLocationSuggestion || 'Dirección por defecto'}
                            </Text>
                            <Text style={styles.partyDetail}>Attn: {request.userName}</Text>
                            <Text style={styles.partyDetail}>{request.department}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Items Table */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.colDesc, styles.tableHeadText]}>Descripción</Text>
                        <Text style={[styles.colQty, styles.tableHeadText]}>Cant</Text>
                        <Text style={[styles.colPrice, styles.tableHeadText]}>Precio</Text>
                        <Text style={[styles.colTotal, styles.tableHeadText]}>Total</Text>
                    </View>

                    {/* Assuming Request Details match Quote - Simple mock of items mapping for now 
                        If quote doesn't have breakdown, we assume 1 line item or map request items 
                    */}
                    {request.items && request.items.length > 0 ? (
                        request.items.map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.colDesc}>{item.name}</Text>
                                <Text style={styles.colQty}>{item.quantity} {item.unit}</Text>
                                <Text style={styles.colPrice}>-</Text>
                                <Text style={styles.colTotal}>-</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.tableRow}>
                            <Text style={styles.colDesc}>{request.title}</Text>
                            <Text style={styles.colQty}>1 GL</Text>
                            <Text style={styles.colPrice}>${subtotal.toFixed(2)}</Text>
                            <Text style={styles.colTotal}>${subtotal.toFixed(2)}</Text>
                        </View>
                    )}

                    {/* Totals - Using Quotation Total because individual items price might not be in Request */}
                    <View style={styles.totalsContainer}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal:</Text>
                            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>IVA (15%):</Text>
                            <Text style={styles.totalValue}>${vat.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.totalRow, styles.grandTotalRow]}>
                            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
                            <Text style={styles.grandTotalValue}>${total.toFixed(2)} {quotation.currency}</Text>
                        </View>
                    </View>

                    {/* Conditions */}
                    <View style={styles.conditions}>
                        <Text style={styles.conditionsTitle}>Condiciones:</Text>
                        <Text style={styles.conditionsText}>• Tiempo de entrega: {quotation.deliveryDays} días.</Text>
                        <Text style={styles.conditionsText}>• Pago: {quotation.paymentTerms}.</Text>
                        <Text style={styles.conditionsText}>• Esta orden de compra constituye aceptación firme de la oferta.</Text>
                    </View>

                    <View style={{ height: 60 }} />

                    {/* Signatures */}
                    <View style={styles.signatures}>
                        <View style={styles.signatureBox}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>Autorizado Por</Text>
                            <Text style={styles.signatureTitle}>Gerente de Compras</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureName}>Recibido Por</Text>
                            <Text style={styles.signatureTitle}>Proveedor</Text>
                        </View>
                    </View>

                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.actionButton} onPress={handlePrint}>
                    <Text style={styles.actionButtonText}>Imprimir / Descargar PDF</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    backButton: {
        padding: 8,
    },
    printButton: {
        padding: 8,
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    paper: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    paperHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    brandName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 1,
    },
    brandSub: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    companyInfo: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    poNumberBox: {
        alignItems: 'flex-end',
    },
    poLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        textTransform: 'uppercase',
    },
    poNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginTop: 4,
    },
    poDate: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#EEE',
        marginVertical: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    column: {
        flex: 1,
    },
    sectionLabel: {
        fontSize: 10,
        color: '#999',
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    partyName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    partyDetail: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F9F9F9',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    tableHeadText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    colDesc: { flex: 2, fontSize: 12, color: '#333' },
    colQty: { flex: 0.8, fontSize: 12, color: '#333', textAlign: 'center' },
    colPrice: { flex: 0.8, fontSize: 12, color: '#333', textAlign: 'right' },
    colTotal: { flex: 0.8, fontSize: 12, color: '#333', textAlign: 'right' },

    totalsContainer: {
        marginTop: 16,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        marginBottom: 6,
        width: '50%',
        justifyContent: 'space-between',
    },
    totalLabel: {
        fontSize: 12,
        color: '#666',
    },
    totalValue: {
        fontSize: 12,
        color: '#333',
        fontWeight: '600',
    },
    grandTotalRow: {
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 8,
        marginTop: 4,
    },
    grandTotalLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    grandTotalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    conditions: {
        marginTop: 24,
        padding: 12,
        backgroundColor: '#F9F9F9',
        borderRadius: 4,
    },
    conditionsTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    conditionsText: {
        fontSize: 11,
        color: '#666',
        marginBottom: 2,
    },
    signatures: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 40,
    },
    signatureBox: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 16,
    },
    signatureLine: {
        width: '100%',
        height: 1,
        backgroundColor: '#333',
        marginBottom: 8,
    },
    signatureName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    signatureTitle: {
        fontSize: 10,
        color: '#666',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    actionButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
