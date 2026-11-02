export enum MediaTypeOptions {
  All = 'All',
  Videos = 'Videos',
  Images = 'Images',
}

export async function requestMediaLibraryPermissionsAsync() {
  return { status: 'granted', granted: true, canAskAgain: true, expires: 'never' };
}

export async function requestCameraPermissionsAsync() {
  return { status: 'granted', granted: true, canAskAgain: true, expires: 'never' };
}

export async function getMediaLibraryPermissionsAsync() {
  return { status: 'granted', granted: true, canAskAgain: true, expires: 'never' };
}

export async function getCameraPermissionsAsync() {
  return { status: 'granted', granted: true, canAskAgain: true, expires: 'never' };
}

export async function launchCameraAsync(options?: {
  mediaTypes?: any;
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  base64?: boolean;
}) {
  return launchImageLibraryAsync(options);
}

export async function launchImageLibraryAsync(options?: {
  mediaTypes?: any;
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  base64?: boolean;
  allowsMultipleSelection?: boolean;
}): Promise<{
  canceled: boolean;
  assets: Array<{
    uri: string;
    width: number;
    height: number;
    type: string;
    base64?: string;
    fileName?: string;
    fileSize?: number;
  }> | null;
}> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      return resolve({ canceled: true, assets: null });
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (options?.allowsMultipleSelection) {
      input.multiple = true;
    }

    input.onchange = async () => {
      const files = input.files;
      if (!files || files.length === 0) {
        return resolve({ canceled: true, assets: null });
      }

      const assets: any[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uri = URL.createObjectURL(file);
        
        let base64: string | undefined = undefined;
        if (options?.base64) {
          base64 = await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const resStr = reader.result as string;
              res(resStr.split(',')[1] || '');
            };
            reader.readAsDataURL(file);
          });
        }

        assets.push({
          uri,
          width: 800,
          height: 600,
          type: 'image',
          fileName: file.name,
          fileSize: file.size,
          base64,
        });
      }

      resolve({ canceled: false, assets });
    };

    input.click();
  });
}

const ImagePicker = {
  MediaTypeOptions,
  requestMediaLibraryPermissionsAsync,
  requestCameraPermissionsAsync,
  getMediaLibraryPermissionsAsync,
  getCameraPermissionsAsync,
  launchCameraAsync,
  launchImageLibraryAsync,
};

export default ImagePicker;
