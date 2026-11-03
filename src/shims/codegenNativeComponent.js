import React from 'react';
import { View } from 'react-native-web';

export default function codegenNativeComponent(componentName, options) {
  return React.forwardRef((props, ref) => React.createElement(View, { ...props, ref }));
}
