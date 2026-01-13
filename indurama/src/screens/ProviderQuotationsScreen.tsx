/**
 * ProviderQuotationsScreen - Pantalla para que el Proveedor vea sus invitaciones y cotizaciones
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { QuotationService } from '../services/quotationService';
import { QuotationInvitation, Quotation } from '../types';
import { db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { theme } from '../styles/theme';

interface ProviderQuotationsScreenProps {
    supplierId: string;
    onNavigateBack: () => void;
    onNavigateToQuotationForm: (invitationId: string, requestId: string) => void;
    onNavigateToQuotationDetail?: (quotationId: string) => void;
}

export const ProviderQuotationsScreen: React.FC<ProviderQuotationsScreenProps> = ({
    supplierId,
    onNavigateBack,
    onNavigateToQuotationForm,
    onNavigateToQuotationDetail,
}) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'sent' | 'history'>('pending');
    const [invitations, setInvitations] = useState<(QuotationInvitation & { requestDescription?: string })[]>([]);
    const [quotations, setQuotations] = useState<Quotation[]>([]);

    useEffect(() => {
        loadData();
    }, [supplierId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [invs, quotes] = await Promise.all([
                QuotationService.getProviderInvitations(supplierId),
                QuotationService.getProviderQuotations(supplierId),
            ]);

            // Enriquecer invitaciones con descripción de la solicitud
            const enrichedInvitations = await Promise.all(
                invs.map(async (inv) => {
                    try {
                        const reqDoc = await getDoc(doc(db, 'requests', inv.requestId));
                        return {
                            ...inv,
                            requestDescription: reqDoc.exists() ? reqDoc.data()?.description : 'Sin descripción',
                        };
                    } catch {
                        return { ...inv, requestDescription: 'Sin descripción' };
                    }
                })
            );

            setInvitations(enrichedInvitations);
            setQuotations(quotes);
        } catch (error) {
            console.error('Error loading quotations data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const pendingInvitations = invitations.filter(i => i.status === 'pending' || i.status === 'viewed');
    const sentQuotations = quotations.filter(q => q.status === 'submitted');
    const historyQuotations = quotations.filter(q => q.status === 'selected' || q.status === 'rejected');

    const getStatusBadge = (status: string, isWinner?: boolean) => {
        let label = '';
        let color = '#666';

        switch (status) {
            case 'pending':
                label = 'PENDIENTE';
                color = '#FFA726';
                break;
            case 'viewed':
                label = 'VISTA';
                color = '#2196F3';
                break;
            case 'submitted':
                label = 'ENVIADA';
                color = '#4CAF50';
                break;
            case 'selected':
                label = isWinner ? '🏆 GANADORA' : 'SELECCIONADA';
                color = '#4CAF50';
                break;
            case 'rejected':
                label = 'NO SELECCIONADA';
                color = '#F44336';
                break;
            default:
                label = status.toUpperCase();
        }

        return (
            <View style={[styles.statusBadge, { borderColor: color }]}>
                <Text style={[styles.statusText, { color }]}>{label}</Text>
            </View>
        );
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const handleViewInvitation = async (invitation: QuotationInvitation) => {
        // Marcar como vista si es pending
        if (invitation.status === 'pending') {
            await QuotationService.markInvitationViewed(invitation.id);
        }
        onNavigateToQuotationForm(invitation.id, invitation.requestId);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Cargando cotizaciones...</Text>
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
                <Text style={styles.headerTitle}>Mis Cotizaciones</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
                        Pendientes
                    </Text>
                    {pendingInvitations.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{pendingInvitations.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
                    onPress={() => setActiveTab('sent')}
                >
                    <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
                        Enviadas
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'history' && styles.tabActive]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                        Historial
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Pending Invitations */}
                {activeTab === 'pending' && (
                    <>
                        {pendingInvitations.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="mail-open-outline" size={48} color="#CCC" />
                                <Text style={styles.emptyText}>No tienes invitaciones pendientes</Text>
                            </View>
                        ) : (
                            pendingInvitations.map(invitation => (
                                <TouchableOpacity
                                    key={invitation.id}
                                    style={styles.card}
                                    onPress={() => handleViewInvitation(invitation)}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardCode}>
                                            #{invitation.requestId.slice(-6).toUpperCase()}
                                        </Text>
                                        {getStatusBadge(invitation.status)}
                                    </View>
                                    <Text style={styles.cardTitle}>{invitation.requestDescription}</Text>
                                    <View style={styles.cardFooter}>
                                        <View style={styles.dateRow}>
                                            <Ionicons name="calendar-outline" size={14} color="#999" />
                                            <Text style={styles.dateText}>Fecha límite: {formatDate(invitation.dueDate)}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                                    </View>
                                    {invitation.message && (
                                        <View style={styles.messageBox}>
                                            <Text style={styles.messageLabel}>Mensaje del gestor:</Text>
                                            <Text style={styles.messageText}>{invitation.message}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </>
                )}

                {/* Sent Quotations */}
                {activeTab === 'sent' && (
                    <>
                        {sentQuotations.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="document-text-outline" size={48} color="#CCC" />
                                <Text style={styles.emptyText}>No has enviado cotizaciones</Text>
                            </View>
                        ) : (
                            sentQuotations.map(quotation => (
                                <TouchableOpacity
                                    key={quotation.id}
                                    style={styles.card}
                                    onPress={() => onNavigateToQuotationForm(quotation.invitationId, quotation.requestId)}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardCode}>
                                            #{quotation.requestId.slice(-6).toUpperCase()}
                                        </Text>
                                        {getStatusBadge(quotation.status)}
                                    </View>
                                    <View style={styles.amountRow}>
                                        <Text style={styles.amountLabel}>Tu oferta:</Text>
                                        <Text style={styles.amountValue}>
                                            ${quotation.totalAmount.toLocaleString()} {quotation.currency}
                                        </Text>
                                    </View>
                                    <Text style={styles.deliveryText}>
                                        Entrega en {quotation.deliveryDays} días
                                    </Text>
                                    <View style={styles.cardFooter}>
                                        <Text style={styles.dateText}>Enviada: {formatDate(quotation.submittedAt)}</Text>
                                        <Text style={styles.waitingText}>Esperando resultado...</Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </>
                )}

                {/* History */}
                {activeTab === 'history' && (
                    <>
                        {historyQuotations.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="time-outline" size={48} color="#CCC" />
                                <Text style={styles.emptyText}>Sin historial de cotizaciones</Text>
                            </View>
                        ) : (
                            historyQuotations.map(quotation => (
                                <TouchableOpacity
                                    key={quotation.id}
                                    style={[styles.card, quotation.isWinner && styles.cardWinner]}
                                    onPress={() => onNavigateToQuotationForm(quotation.invitationId, quotation.requestId)}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardCode}>
                                            #{quotation.requestId.slice(-6).toUpperCase()}
                                        </Text>
                                        {getStatusBadge(quotation.status, quotation.isWinner)}
                                    </View>
                                    <View style={styles.amountRow}>
                                        <Text style={styles.amountLabel}>Tu oferta:</Text>
                                        <Text style={styles.amountValue}>
                                            ${quotation.totalAmount.toLocaleString()} {quotation.currency}
                                        </Text>
                                    </View>
                                    {quotation.isWinner && (
                                        <View style={styles.winnerBanner}>
                                            <Ionicons name="trophy" size={20} color="#FFF" />
                                            <Text style={styles.winnerText}>¡Felicitaciones! Ganaste esta cotización</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
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
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        fontSize: 14,
        color: '#666',
    },
    tabTextActive: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    badge: {
        backgroundColor: '#F44336',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardWinner: {
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardCode: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
    },
    statusBadge: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 12,
        color: '#999',
    },
    messageBox: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
    },
    messageLabel: {
        fontSize: 11,
        color: '#666',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 13,
        color: '#333',
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    amountLabel: {
        fontSize: 13,
        color: '#666',
        marginRight: 8,
    },
    amountValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    deliveryText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 12,
    },
    waitingText: {
        fontSize: 12,
        color: '#FFA726',
        fontStyle: 'italic',
    },
    winnerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    winnerText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default ProviderQuotationsScreen;
