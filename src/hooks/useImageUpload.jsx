import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const pickAndUpload = async (bucketName) => {
    return new Promise((resolve) => {
      Alert.alert(
        'Adicionar Imagem',
        'Escolha a origem da imagem:',
        [
          {
            text: 'Câmera',
            onPress: () => handleImageSelection('camera', bucketName, resolve),
          },
          {
            text: 'Galeria',
            onPress: () => handleImageSelection('gallery', bucketName, resolve),
          },
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  };

  const handleImageSelection = async (source, bucketName, resolve) => {
    try {
      let result;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão negada', 'Precisamos de acesso à câmera.');
          return resolve(null);
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7, // Reduce quality to save space
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão negada', 'Precisamos de acesso à galeria.');
          return resolve(null);
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        const uri = result.assets[0].uri;
        
        // 1. Read file as Base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // 2. Decode to ArrayBuffer
        const arrayBuffer = decode(base64);

        // 3. Generate unique filename
        const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;

        // 4. Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filename, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (error) {
          throw error;
        }

        // 5. Get Public URL
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filename);

        resolve(publicUrlData.publicUrl);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Erro no Upload', 'Não foi possível enviar a imagem. Tente novamente.');
      resolve(null);
    } finally {
      setUploading(false);
    }
  };

  return { pickAndUpload, uploading };
}
