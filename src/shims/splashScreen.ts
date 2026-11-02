export async function preventAutoHideAsync(): Promise<boolean> {
  return true;
}

export async function hideAsync(): Promise<boolean> {
  return true;
}

export async function hide(): Promise<void> {}

export async function preventAutoHide(): Promise<void> {}

const SplashScreen = {
  preventAutoHideAsync,
  hideAsync,
  hide,
  preventAutoHide,
};

export default SplashScreen;
