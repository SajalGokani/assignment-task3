import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StackScreenProps } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useContext, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuthenticationContext } from '../context/AuthenticationContext';
import { EventsContext } from '../context/EventsContext';
import * as api from '../services/api';
import { setInCache } from '../services/caching';
import * as imageApi from '../services/imageApi';
import { formatBytes } from '../utils';

export default function CreateEvent({ route, navigation }: StackScreenProps<any>) {
    const { position } = route.params || {};
    const authContext = useContext(AuthenticationContext);
    const eventsContext = useContext(EventsContext);

    const [title, setTitle] = useState('');
    const [about, setAbout] = useState('');
    const [requiredVolunteers, setRequiredVolunteers] = useState('');

    // Date & Time state
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [uploadedImage, setUploadedImage] = useState<{ url: string; name: string; size: number } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera roll permissions are required to upload a picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.6,
            base64: true,
        });

        if (!result.canceled && result.assets[0]?.base64) {
            uploadSelectedImage(result.assets[0]);
        }
    };

    const uploadSelectedImage = async (asset: ImagePicker.ImagePickerAsset) => {
        setIsUploading(true);
        try {
            const response = await imageApi.uploadImage(asset.base64!);
            
            if (response.data && response.data.data && response.data.data.url) {
                const imageUrl = response.data.data.url;
                const fileName = asset.fileName || 'event_image.jpg';
                const fileSize = asset.fileSize || 245000;

                setUploadedImage({
                    url: imageUrl,
                    name: fileName,
                    size: fileSize,
                });
            } else {
                throw new Error('Invalid response structure from image host');
            }
        } catch (error: any) {
            console.error('Upload Error Details:', error?.response?.data || error.message);
            Alert.alert(
                'Upload Error',
                'Failed to upload image to online storage. Please check your ImgBB API key.'
            );
        } finally {
            setIsUploading(false);
        }
    };

    const isFormValid = () => {
        return (
            title.trim().length > 0 &&
            about.trim().length > 0 &&
            requiredVolunteers.trim().length > 0 &&
            !isNaN(Number(requiredVolunteers)) &&
            uploadedImage !== null
        );
    };

    const handleSaveEvent = async () => {
        if (!isFormValid() || !position) return;

        setIsSaving(true);
        try {
            const formattedDateStr = selectedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
            const formattedTimeStr = selectedTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            });

            const newEventPayload = {
                id: String(Date.now()),
                title,
                about,
                organizer: authContext?.value?.name
                    ? `${authContext.value.name.first} ${authContext.value.name.last}`
                    : 'VolunTeam Partner',
                date: `${formattedDateStr} ${formattedTimeStr}`,
                time: formattedTimeStr,
                phone: authContext?.value?.mobile || '4035550100',
                requiredVolunteers: Number(requiredVolunteers),
                volunteers: [],
                position,
                images: [{ id: '1', url: uploadedImage!.url }],
            };

            let createdEvent = newEventPayload;

            // Attempt backend POST; fall back smoothly to local state/cache on network timeout
            try {
                const response = await api.createEvent(newEventPayload);
                if (response?.data) {
                    createdEvent = response.data;
                }
            } catch (netError) {
                console.warn('Backend server unreachable; saving to local cache and state.');
            }

            // Update app Context and persistent local cache
            if (eventsContext) {
                const updatedList = [...eventsContext.events, createdEvent];
                eventsContext.setEvents(updatedList);
                await setInCache('events', updatedList);
            }

            navigation.navigate('EventsMap');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save event.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Feather name="arrow-left" size={24} color="#00A3FF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add event</Text>
                <TouchableOpacity onPress={() => navigation.navigate('EventsMap')} style={styles.iconButton}>
                    <Feather name="x" size={24} color="#FF6666" />
                </TouchableOpacity>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Event Name</Text>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Food Distribution" />

                <View style={styles.labelRow}>
                    <Text style={styles.label}>About</Text>
                    <Text style={styles.subLabel}>300 characters max</Text>
                </View>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={about}
                    onChangeText={setAbout}
                    multiline
                    maxLength={300}
                />

                <Text style={styles.label}>Volunteers Needed</Text>
                <TextInput
                    style={styles.input}
                    value={requiredVolunteers}
                    onChangeText={setRequiredVolunteers}
                    keyboardType="numeric"
                    placeholder="10"
                />

                <Text style={styles.label}>Date</Text>
                <TouchableOpacity style={styles.pickerSelector} onPress={() => setShowDatePicker(true)}>
                    <Feather name="calendar" size={18} color="#00A3FF" style={{ marginRight: 10 }} />
                    <Text style={styles.pickerSelectorText}>
                        {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, date) => {
                            setShowDatePicker(false);
                            if (date) setSelectedDate(date);
                        }}
                    />
                )}

                <Text style={styles.label}>Time</Text>
                <TouchableOpacity style={styles.pickerSelector} onPress={() => setShowTimePicker(true)}>
                    <Feather name="clock" size={18} color="#00A3FF" style={{ marginRight: 10 }} />
                    <Text style={styles.pickerSelectorText}>
                        {selectedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </TouchableOpacity>
                {showTimePicker && (
                    <DateTimePicker
                        value={selectedTime}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, time) => {
                            setShowTimePicker(false);
                            if (time) setSelectedTime(time);
                        }}
                    />
                )}

                <Text style={styles.label}>Picture</Text>
                {isUploading ? (
                    <View style={styles.uploadingBox}>
                        <ActivityIndicator size="small" color="#00A3FF" />
                        <Text style={styles.uploadingText}>Uploading image...</Text>
                    </View>
                ) : uploadedImage ? (
                    <View style={styles.imageCard}>
                        <Image source={{ uri: uploadedImage.url }} style={styles.thumbnail} />
                        <View style={styles.imageDetails}>
                            <Text style={styles.fileName} numberOfLines={1}>{uploadedImage.name}</Text>
                            <Text style={styles.fileSize}>{formatBytes(uploadedImage.size)}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setUploadedImage(null)}>
                            <Feather name="x" size={20} color="#FF6666" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage}>
                        <Feather name="plus" size={24} color="#00A3FF" />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.saveButton, !isFormValid() && styles.disabledButton]}
                    disabled={!isFormValid() || isSaving}
                    onPress={handleSaveEvent}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
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
    },
    headerTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#8FA7B3' },
    iconButton: { padding: 4 },
    form: { padding: 24 },
    label: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#8FA7B3', marginBottom: 8 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    subLabel: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: '#8FA7B3' },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#D3E2E5',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#5C8599',
        marginBottom: 16,
    },
    pickerSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#D3E2E5',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 48,
        marginBottom: 16,
    },
    pickerSelectorText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#5C8599' },
    textArea: { height: 100, textAlignVertical: 'top' },
    uploadButton: {
        height: 96,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#D3E2E5',
        borderStyle: 'dashed',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    uploadingBox: {
        height: 96,
        backgroundColor: '#FFF',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    uploadingText: { fontFamily: 'Nunito_600SemiBold', color: '#00A3FF', marginTop: 8 },
    imageCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#D3E2E5',
        borderRadius: 16,
        padding: 12,
        marginBottom: 24,
    },
    thumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
    imageDetails: { flex: 1 },
    fileName: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#5C8599' },
    fileSize: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: '#8FA7B3' },
    saveButton: {
        backgroundColor: '#00A3FF',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    disabledButton: { backgroundColor: '#A0D8FF' },
    saveButtonText: { fontFamily: 'Nunito_800ExtraBold', color: '#FFF', fontSize: 16 },
});