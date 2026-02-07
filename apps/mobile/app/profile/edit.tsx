import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { BeltAvatar } from '../../components/BeltAvatar';
import { useMemberBelts } from '../../hooks/useMemberBelts';

export default function EditProfileScreen() {
  const { profile, refreshProfile } = useAuth();
  const { highestBelt } = useMemberBelts(profile?.id);

  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePicture, setProfilePicture] = useState(profile?.profile_picture_url);

  const hasChanges =
    firstName !== (profile?.first_name || '') ||
    lastName !== (profile?.last_name || '') ||
    phone !== (profile?.phone || '');

  const handleSave = async () => {
    if (!profile?.id) return;
    if (!firstName.trim()) {
      Alert.alert('Fout', 'Voornaam is verplicht');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      Alert.alert('Opgeslagen', 'Je profiel is bijgewerkt', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert('Fout', 'Kon profiel niet opslaan. Probeer het opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Toestemming nodig', 'We hebben toegang tot je fotobibliotheek nodig om een profielfoto te kiezen.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    await uploadPhoto(result.assets[0].uri);
  };

  const uploadPhoto = async (uri: string) => {
    if (!profile?.id) return;
    setUploadingPhoto(true);

    try {
      const ext = uri.split('.').pop() || 'jpg';
      const fileName = `${profile.id}/avatar.${ext}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      // Convert blob to ArrayBuffer for Supabase
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Add cache buster
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('members')
        .update({ profile_picture_url: urlWithCacheBust })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfilePicture(urlWithCacheBust);
      await refreshProfile();
    } catch (error) {
      console.error('Upload photo error:', error);
      Alert.alert('Fout', 'Kon foto niet uploaden. Probeer het opnieuw.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Profiel niet gevonden</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile Picture */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto}>
            {uploadingPhoto ? (
              <View style={styles.photoPlaceholder}>
                <ActivityIndicator size="large" color="#D4AF37" />
              </View>
            ) : (
              <BeltAvatar
                imageUrl={profilePicture}
                firstName={profile.first_name}
                lastName={profile.last_name}
                beltColor={highestBelt}
                size={100}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto}>
            <Text style={styles.changePhotoText}>
              {uploadingPhoto ? 'Uploaden...' : 'Foto wijzigen'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Voornaam *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Je voornaam"
              placeholderTextColor="#555"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Achternaam</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Je achternaam"
              placeholderTextColor="#555"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Telefoonnummer</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+32 4XX XX XX XX"
              placeholderTextColor="#555"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{profile.email}</Text>
              <Ionicons name="lock-closed" size={16} color="#555" />
            </View>
            <Text style={styles.hint}>E-mail kan niet worden gewijzigd</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.saveButtonText}>Opslaan</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#888',
    fontSize: 16,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    gap: 20,
    marginTop: 10,
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  readOnlyField: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  readOnlyText: {
    color: '#555',
    fontSize: 16,
  },
  hint: {
    color: '#444',
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
