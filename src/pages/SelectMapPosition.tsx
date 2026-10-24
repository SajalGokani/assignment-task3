import { Feather } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import EventMapWebView from '../components/EventMapWebView';

export default function SelectMapPosition({ navigation }: StackScreenProps<any>) {
    const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);

    // Explicitly set pin position on map click or event selection
    const handleMapClick = (param: any) => {
        if (param && typeof param === 'object' && typeof param.latitude === 'number' && typeof param.longitude === 'number') {
            setPosition({ latitude: param.latitude, longitude: param.longitude });
        }
    };

    const handleNextStep = () => {
        if (!position) return;
        navigation.navigate('CreateEvent', { position });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Feather name="arrow-left" size={24} color="#00A3FF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Event Location</Text>
                <TouchableOpacity onPress={() => navigation.navigate('EventsMap')} style={styles.iconButton}>
                    <Feather name="x" size={24} color="#FF6666" />
                </TouchableOpacity>
            </View>

            <View style={styles.mapWrapper}>
                <EventMapWebView
                    events={
                        position
                            ? [
                                  {
                                      id: 'selected-pin',
                                      title: 'Selected Location',
                                      about: '',
                                      organizer: '',
                                      date: '',
                                      time: '',
                                      phone: '',
                                      requiredVolunteers: 0,
                                      volunteers: [],
                                      position,
                                      images: [],
                                  },
                              ]
                            : []
                    }
                    interactive={true}
                    onSelectEvent={handleMapClick as any}
                />
            </View>

            {position && (
                <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
                    <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F3F5' },
    header: {
        height: 80,
        paddingTop: 36,
        paddingHorizontal: 20,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        zIndex: 10,
    },
    headerTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#8FA7B3' },
    iconButton: { padding: 4 },
    mapWrapper: { flex: 1 },
    nextButton: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 40,
        backgroundColor: '#00A3FF',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        zIndex: 20,
    },
    nextButtonText: { fontFamily: 'Nunito_800ExtraBold', color: '#FFF', fontSize: 16 },
});