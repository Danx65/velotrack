import React from 'react';

export function StatusBar(props: { style?: 'auto' | 'inverted' | 'light' | 'dark'; hidden?: boolean; backgroundColor?: string }) {
  return null;
}

export function setStatusBarHidden(hidden: boolean, animation?: string) {}
export function setStatusBarStyle(style: string, animated?: boolean) {}
export function setStatusBarNetworkActivityIndicatorVisible(visible: boolean) {}
export function setStatusBarBackgroundColor(backgroundColor: string, animated?: boolean) {}
export function setStatusBarTranslucent(translucent: boolean) {}

export default StatusBar;
