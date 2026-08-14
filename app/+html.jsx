import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }) {
  return (
    <html lang="pt-BR" style={{ backgroundColor: '#060814' }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="theme-color" content="#060814" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <style dangerouslySetInnerHTML={{ __html: 'html, body { background-color: #060814 !important; }' }} />
        <ScrollViewStyleReset />
      </head>
      <body style={{ backgroundColor: '#060814' }}>{children}</body>
    </html>
  );
}
