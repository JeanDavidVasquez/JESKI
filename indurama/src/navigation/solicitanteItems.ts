import { Ionicons } from '@expo/vector-icons';

export interface SolicitanteNavCallbacks {
    onNavigateToDashboard: () => void;
    onNavigateToNewRequest?: () => void;
    onNavigateToHistory: () => void;
    onNavigateToProfile: () => void;
}

export const getSolicitanteNavItems = (t: any, callbacks: SolicitanteNavCallbacks) => [
    {
        key: 'Dashboard',
        label: t('navigation.dashboard'),
        iconName: 'home' as const,
        onPress: callbacks.onNavigateToDashboard
    },
    {
        key: 'NewRequest',
        label: t('requests.newRequest'),
        iconName: 'add-circle' as const,
        onPress: callbacks.onNavigateToNewRequest || (() => { })
    },
    {
        key: 'History',
        label: t('navigation.history'),
        iconName: 'document-text' as const,
        onPress: callbacks.onNavigateToHistory
    },
    {
        key: 'Profile',
        label: t('navigation.profile'),
        iconName: 'person' as const,
        onPress: callbacks.onNavigateToProfile
    },
];
