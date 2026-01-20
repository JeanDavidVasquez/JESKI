import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QuotationService } from '../services/quotationService';
import { QuotationComment } from '../types';
import { theme } from '../styles/theme';
import { useAuth } from '../hooks/useAuth';

interface QuotationCommentsProps {
    requestId: string;
    supplierId: string;
    currentUserRole: 'gestor' | 'proveedor';
    quotationId?: string; // Optional, link to specific quote if exists
    user?: any; // User object passed directly (fallback if Auth Provider issues)
}

export const QuotationComments: React.FC<QuotationCommentsProps> = ({
    requestId,
    supplierId,
    currentUserRole,
    quotationId,
    user: propUser
}) => {
    const { user: authUser } = useAuth();
    const user = propUser || authUser; // Prefer prop if provided
    const [comments, setComments] = useState<QuotationComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');
    const listRef = useRef<FlatList>(null);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const setupSubscription = () => {
            setLoading(true);
            unsubscribe = QuotationService.subscribeToComments(requestId, supplierId, (newComments) => {
                setComments(newComments);
                setLoading(false);
                setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

                // Mark as read whenever new messages arrive (if I'm viewing)
                markAsRead();
            });
        };

        setupSubscription();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [requestId, supplierId]);

    const markAsRead = async () => {
        try {
            const roleToRead = currentUserRole === 'gestor' ? 'proveedor' : 'gestor';
            await QuotationService.markCommentsAsRead(requestId, supplierId, roleToRead);
        } catch (error) {
            console.error('Error marking comments as read:', error);
        }
    };

    const handleSend = async () => {
        if (!message.trim()) return;

        if (!user) {
            console.error('No user found in QuotationComments');
            Alert.alert('Error', 'No se puede enviar el mensaje. Sesión no válida.');
            return;
        }

        try {
            setSending(true);
            const content = message.trim();
            setMessage(''); // Clear immediately for UX

            await QuotationService.addComment({
                requestId,
                supplierId,
                quotationId,
                authorId: user.id,
                authorName: user.companyName || `${user.firstName} ${user.lastName}` || user.email || 'Usuario',
                authorRole: currentUserRole,
                message: content,
            });

            // Optimistic update or wait for subscription
            // await loadComments(); // Subscription handles this now
        } catch (error) {
            console.error('Error sending comment:', error);
            Alert.alert('Error', 'No se pudo enviar el mensaje');
            setMessage(message); // Restore text on error
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    const renderItem = ({ item, index }: { item: QuotationComment; index: number }) => {
        const isMe = item.authorRole === currentUserRole;
        const showDate = index === 0 ||
            formatDate(item.createdAt) !== formatDate(comments[index - 1].createdAt);

        return (
            <View>
                {showDate && (
                    <View style={styles.dateSeparator}>
                        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                    </View>
                )}
                <View style={[
                    styles.messageContainer,
                    isMe ? styles.myMessage : styles.theirMessage
                ]}>
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                        {item.message}
                    </Text>
                    <View style={styles.messageFooter}>
                        <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.theirTimeText]}>
                            {formatTime(item.createdAt)}
                        </Text>
                        {isMe && (
                            <Ionicons
                                name={item.read ? "checkmark-done" : "checkmark"}
                                size={14}
                                color="rgba(255,255,255,0.7)"
                                style={{ marginLeft: 4 }}
                            />
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                ref={listRef}
                data={comments}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No hay mensajes aún.</Text>
                        <Text style={styles.emptySubText}>Envía una pregunta o comentario.</Text>
                    </View>
                }
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Escribe un mensaje..."
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, (!message.trim() || sending) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!message.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Ionicons name="send" size={20} color="#FFF" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        minHeight: 300,
    },
    loadingContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 8,
    },
    dateSeparator: {
        alignItems: 'center',
        marginVertical: 12,
    },
    dateText: {
        fontSize: 12,
        color: '#999',
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    messageContainer: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    messageText: {
        fontSize: 15,
        marginBottom: 4,
    },
    myMessageText: {
        color: '#FFFFFF',
    },
    theirMessageText: {
        color: '#333333',
    },
    messageFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 10,
    },
    myTimeText: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirTimeText: {
        color: '#999999',
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptySubText: {
        color: '#999',
        fontSize: 14,
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: '#F9F9F9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonDisabled: {
        backgroundColor: '#CCC',
    },
});
