import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

// Na Vercel (versão pública) o plugin Base44 não é carregado; no editor Base44
// ele continua ativo para a pré-visualização.
export default defineConfig(async () => {
  const publico = !!process.env.VERCEL || process.env.PUBLIC_BUILD === 'true';
  const plugins = [react()];
  if (!publico) {
    const { default: base44 } = await import('@base44/vite-plugin');
    plugins.unshift(base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }));
  }
  return {
    plugins,
    resolve: {
      alias: [
        ...(publico ? [{ find: /^@\/App\.jsx$/, replacement: path.resolve(__dirname, 'src/PublicApp.jsx') }] : []),
        { find: '@', replacement: path.resolve(__dirname, 'src') },
      ],
    },
  };
});