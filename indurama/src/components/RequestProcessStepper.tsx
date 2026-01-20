import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../styles/theme';

interface RequestProcessStepperProps {
    currentStep: 1 | 2 | 3;
    onStepPress?: (step: 1 | 2 | 3) => void;
}

export const RequestProcessStepper: React.FC<RequestProcessStepperProps> = ({
    currentStep,
    onStepPress
}) => {

    const renderStep = (step: 1 | 2 | 3, label: string) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        // Determine styles based on state
        let circleStyle: StyleProp<ViewStyle> = styles.stepCircle;
        let numberStyle: StyleProp<TextStyle> = styles.stepNumber;
        let labelStyle: StyleProp<TextStyle> = styles.stepLabel;

        if (isActive) {
            circleStyle = [styles.stepCircle, styles.stepActive];
            numberStyle = [styles.stepNumber, styles.stepTextActive];
            labelStyle = [styles.stepLabel, styles.stepLabelActive];
        } else if (isCompleted) {
            circleStyle = [styles.stepCircle, styles.stepCompleted];
            numberStyle = [styles.stepNumber, styles.stepTextCompleted];
            labelStyle = [styles.stepLabel, styles.stepLabelCompleted];
        }

        return (
            <TouchableOpacity
                style={styles.stepItem}
                onPress={() => onStepPress && onStepPress(step)}
                disabled={!onStepPress}
            >
                <View style={circleStyle}>
                    {isCompleted ? (
                        <Text style={numberStyle}>✓</Text>
                    ) : (
                        <Text style={numberStyle}>{step}</Text>
                    )}
                </View>
                <Text style={labelStyle}>{label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.stepsContainer}>
            {renderStep(1, 'Identificar\nNecesidad')}
            <View style={[styles.stepLine, currentStep > 1 && styles.stepLineActive]} />
            {renderStep(2, 'Búsqueda')}
            <View style={[styles.stepLine, currentStep > 2 && styles.stepLineActive]} />
            {renderStep(3, 'Cotización')}
        </View>
    );
};

const styles = StyleSheet.create({
    stepsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30, // Increased margin
        marginTop: 10,
        width: '100%',
        maxWidth: 600,
        alignSelf: 'center'
    },
    stepItem: {
        alignItems: 'center',
        width: 100, // Wider
    },
    stepCircle: {
        width: 48, // Larger
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#00BFFF',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    stepActive: {
        backgroundColor: '#E0F7FF',
        borderColor: '#003E85',
        transform: [{ scale: 1.15 }]
    },
    stepCompleted: {
        backgroundColor: '#003E85',
        borderColor: '#003E85',
    },
    stepNumber: {
        color: '#00BFFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    stepTextActive: {
        color: '#003E85',
        fontWeight: '900',
    },
    stepTextCompleted: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    stepLabel: {
        fontSize: 12,
        textAlign: 'center',
        color: '#6B7280',
        fontWeight: '600',
        lineHeight: 16
    },
    stepLabelActive: {
        color: '#003E85',
        fontWeight: '800',
    },
    stepLabelCompleted: {
        color: '#003E85',
        fontWeight: '700',
    },
    stepLine: {
        height: 3, // Thicker
        backgroundColor: '#E5E7EB',
        flex: 1,
        marginTop: -28, // Adjusted
        marginHorizontal: -5,
        zIndex: -1
    },
    stepLineActive: {
        backgroundColor: '#003E85',
    }
});
