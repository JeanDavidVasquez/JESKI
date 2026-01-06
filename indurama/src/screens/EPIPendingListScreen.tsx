import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    Image,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

interface Submission {
    id: string;
    supplierId: string;
    submittedAt: any;
    // Datos del proveedor
    supplierName: string;
    supplierEmail: string;
    companyName: string;
    calculatedScore?: number;
}

interface EPIPendingListScreenProps {
    onNavigateBack?: () => void;
    onNavigateToAudit?: (submissionId: string, supplierId: string) => void;
}

export const EPIPendingListScreen: React.FC<EPIPendingListScreenProps> = ({
    onNavigateBack,
    onNavigateToAudit
}) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPendingSubmissions();
    }, []);

    const loadPendingSubmissions = async () => {
        try {
            setLoading(true);
            const q = query(
                collection(db, 'epi_submissions'),
                where('status', '==', 'submitted')
            );

            const snapshot = await getDocs(q);
            const data = await Promise.all(
                snapshot.docs.map(async (docSnap) => {
                    const submission = { id: docSnap.id, ...docSnap.data() } as any;

                    // Load supplier data
                    const supplierDoc = await getDoc(doc(db, 'users', submission.supplierId as string));
                    const supplierData = supplierDoc.data();

                    return {
                        id: submission.id,
                        supplierId: submission.supplierId,
                        submittedAt: submission.submittedAt,
                        supplierName: `${supplierData?.firstName || ''} ${supplierData?.lastName || ''}`.trim(),
                        supplierEmail: supplierData?.email || 'Sin email',
                        companyName: supplierData?.companyName || 'Sin empresa',
                        calculatedScore: submission.calculatedScore,
                    } as Submission;
                })
            );

            // Sort by most recent first
            data.sort((a, b) => {
                const dateA = a.submittedAt?.toDate?.() || new Date(0);
                const dateB = b.submittedAt?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
            });

            setSubmissions(data);
        } catch (error) {
            console.error('Error loading submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Fecha desconocida';
        try {
            return timestamp.toDate().toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return 'Fecha inválida';
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
                    <Image
                        source={require('../../assets/icons/arrow-left.png')}
                        style={styles.backIcon}
                        resizeMode="contain"
                    />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>EPIs Pendientes</Text>
                    <Text style={styles.headerSubtitle}>{submissions.length} pendiente{submissions.length !== 1 ? 's' : ''}</Text>
                </View>

                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/icono_indurama.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#003E85" />
                    <Text style={styles.loadingText}>Cargando evaluaciones...</Text>
                </View>
            ) : submissions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>✅</Text>
                    <Text style={styles.emptyTitle}>No hay EPIs pendientes</Text>
                    <Text style={styles.emptyText}>
                        Todas las evaluaciones han sido revisadas
                    </Text>
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {submissions.map((sub) => (
                        <View key={sub.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.avatarContainer}>
                                    <Text style={styles.avatarText}>
                                        {sub.companyName.substring(0, 2).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.companyName}>{sub.companyName}</Text>
                                    <Text style={styles.supplierName}>{sub.supplierName}</Text>
                                    <Text style={styles.supplierEmail}>{sub.supplierEmail}</Text>
                                </View>
                            </View>

                            <View style={styles.cardMeta}>
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaLabel}>Fecha de envío:</Text>
                                    <Text style={styles.metaValue}>{formatDate(sub.submittedAt)}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.auditButton}
                                onPress={() => onNavigateToAudit?.(sub.id, sub.supplierId)}
                            >
                                <Text style={styles.auditButtonText}>Auditar EPI</Text>
                                <Text style={styles.auditButtonArrow}>→</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}
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
    headerSubtitle: {
        fontSize: 12,
        color: '#666666',
        marginTop: 2,
    },
    logoContainer: {
        alignItems: 'center',
    },
    logoImage: {
        width: 40,
        height: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
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
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1976D2',
    },
    cardInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    supplierName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    supplierEmail: {
        fontSize: 12,
        color: '#999',
    },
    cardMeta: {
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    metaLabel: {
        fontSize: 13,
        color: '#999',
    },
    metaValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    auditButton: {
        backgroundColor: '#003E85',
        paddingVertical: 14,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    auditButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        marginRight: 8,
    },
    auditButtonArrow: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});
