import { useState, useRef, useEffect } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  View, Text, Animated, TouchableOpacity, TextInput, ActivityIndicator,
  ImageBackground, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { spacing, radii } from '../src/theme/colors';
import { useThemeColors, useTheme } from '../src/theme';
import porscheImg from '../src/assets/images/velotrack_porsche_1780403578946.png';

export default function LoginScreen() {
  const colors = useThemeColors();
  const { theme, toggleTheme } = useTheme();
  const styles = getStyles(colors);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const { signIn } = useAuth();
  const { width } = useWindowDimensions();

  const [buttonHovered, setButtonHovered] = useState(false);
  const [themeToggleHovered, setThemeToggleHovered] = useState(false);
  const [forgotHovered, setForgotHovered] = useState(false);

  const isDesktop = Platform.OS === 'web' && width > 768;

  const leftFade = useRef(new Animated.Value(0)).current;
  const leftSlide = useRef(new Animated.Value(30)).current;
  const rightFade = useRef(new Animated.Value(0)).current;
  const rightSlide = useRef(new Animated.Value(20)).current;
  
  // Mobile animation ref
  const mobileFade = useRef(new Animated.Value(0)).current;
  const mobileSlide = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    if (isDesktop) {
      Animated.stagger(150, [
        Animated.parallel([
          Animated.timing(leftFade, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(leftSlide, { toValue: 0, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
        ]),
        Animated.parallel([
          Animated.timing(rightFade, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(rightSlide, { toValue: 0, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
        ])
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(mobileFade, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(mobileSlide, { toValue: 0, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    }
  }, [isDesktop]);

  const showError = (msg) => { 
    setError(msg); 
    setTimeout(() => setError(''), 5000); 
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showError('Por favor, informe seu e-mail e senha.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      const m = err?.message || '';
      if (m.includes('Invalid login') || m.includes('invalid_grant') || m.includes('Invalid credentials')) {
        showError('E-mail ou senha incorretos.');
      } else if (m.includes('Email not confirmed')) {
        showError('Confirme seu e-mail antes de entrar.');
      } else if (m.includes('desativada')) {
        showError('Conta desativada. Procure o administrador.');
      } else {
        showError(m || 'Erro ao realizar login no Supabase.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isDesktop) {
    return (
      <View style={[styles.desktopContainer, { backgroundColor: colors.bg }]}>
        {/* Absolute Floating Theme Toggle */}
        <TouchableOpacity 
          style={[
            styles.themeToggleFloating,
            themeToggleHovered ? { backgroundColor: colors.surfaceElevated, transform: [{ scale: 1.05 }], borderColor: colors.primary } : null
          ]} 
          onPress={toggleTheme}
          activeOpacity={0.8}
          onMouseEnter={() => setThemeToggleHovered(true)}
          onMouseLeave={() => setThemeToggleHovered(false)}
        >
          <Ionicons 
            name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} 
            size={18} 
            color={colors.text} 
          />
        </TouchableOpacity>

        {/* Central SaaS Dual-Pane Card Frame */}
        <View style={[styles.desktopCardFrame, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          {/* Left Side: Brand Hero Panel */}
          <Animated.View style={[styles.desktopLeftContainer, { opacity: leftFade, transform: [{ translateY: leftSlide }] }]}>
            <ImageBackground
              source={porscheImg}
              style={styles.desktopLeft}
              resizeMode="cover"
              imageStyle={{
                ...Platform.select({
                  web: {
                    objectPosition: 'center center',
                  }
                })
              }}
            >
              <View style={[styles.desktopLeftOverlay, { backgroundColor: 'rgba(5, 7, 18, 0.32)' }]} />

              <View style={styles.leftFloatingWatermark}>
                <Ionicons name="flash-sharp" size={11} color="#E60050" />
                <Text style={styles.watermarkText}>VELOTRACK TELEMATICS</Text>
              </View>

              <View style={styles.leftFloatingBottom}>
                <View style={{ width: 36, height: 3, backgroundColor: '#E60050', marginBottom: 14, borderRadius: 2 }} />
                <Text style={styles.leftFloatingBottomTitle}>
                  A EVOLUÇÃO DA GESTÃO DE CAMPO
                </Text>
                <Text style={styles.leftFloatingBottomDesc}>
                  Conectando inteligência de dados a operações em tempo real. Monitore rotas, execute ordens de serviço e acompanhe métricas corporativas com precisão.
                </Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                    <Text style={{ fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : 'sans-serif-bold', fontSize: 9, color: 'rgba(255, 255, 255, 0.45)', fontWeight: '700', letterSpacing: 0.8 }}>SISTEMA ONLINE</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="shield-checkmark-outline" size={11} color="rgba(255, 255, 255, 0.4)" />
                    <Text style={{ fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : 'sans-serif-bold', fontSize: 9, color: 'rgba(255, 255, 255, 0.45)', fontWeight: '700', letterSpacing: 0.8 }}>SUPABASE AUTH</Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </Animated.View>

          {/* Right Side: Clean Login Form */}
          <View style={[styles.desktopRight, { backgroundColor: colors.surface }]}>
            <KeyboardAvoidingView behavior="padding" style={styles.flex}>
              <ScrollView
                contentContainerStyle={styles.desktopRightScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Animated.View style={[styles.desktopFormCol, { opacity: rightFade, transform: [{ translateY: rightSlide }] }]}>
                  {/* Brand Logo Header */}
                  <View style={styles.rightHeaderBrand}>
                    <View style={styles.brandLogoIcon}>
                      <Ionicons name="flash-outline" size={15} color={colors.primary} />
                    </View>
                    <Text style={[styles.rightBrandText, { color: colors.text }]}>
                      VELO<Text style={{ color: colors.primary }}>TRACK</Text>
                    </Text>
                  </View>

                  {/* Greeting Header */}
                  <Text style={[styles.desktopSecureTitle, { color: colors.text }]}>
                    Acesse sua conta
                  </Text>
                  <Text style={[styles.desktopSecureSub, { color: colors.textSecondary }]}>
                    Entre com suas credenciais para acessar a plataforma.
                  </Text>

                  {error ? (
                    <View style={[styles.errorBox, { backgroundColor: colors.errorSoft, borderColor: 'rgba(239, 68, 68, 0.2)', width: '100%', marginBottom: 20 }]}>
                      <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {/* Email Field */}
                  <View style={[styles.field, { width: '100%' }]}>
                    <Text style={styles.fieldLabel}>E-mail</Text>
                    <View style={[
                      styles.inputWrap, 
                      { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                      emailFocused ? { borderColor: colors.primary, backgroundColor: colors.primarySoft } : null,
                      email && !emailFocused ? { borderColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : '#D1D5DB' } : null
                    ]}>
                      <Ionicons name="mail-outline" size={16} color={emailFocused ? colors.primary : colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="seu@email.com"
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        onChangeText={(t) => { setEmail(t); setError(''); }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  {/* Password Field */}
                  <View style={[styles.field, { width: '100%', marginBottom: 16 }]}>
                    <Text style={styles.fieldLabel}>Senha</Text>
                    <View style={[
                      styles.inputWrap, 
                      { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                      passwordFocused ? { borderColor: colors.primary, backgroundColor: colors.primarySoft } : null,
                      password && !passwordFocused ? { borderColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : '#D1D5DB' } : null
                    ]}>
                      <Ionicons name="lock-closed-outline" size={16} color={passwordFocused ? colors.primary : colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: colors.text, flex: 1 }]}
                        placeholder="••••••••"
                        placeholderTextColor={colors.textMuted}
                        value={password}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        onChangeText={(t) => { setPassword(t); setError(''); }}
                        secureTextEntry={!show}
                        autoCapitalize="none"
                        editable={!loading}
                      />
                      <TouchableOpacity onPress={() => setShow(!show)} style={styles.eye}>
                        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Options Row: Remember Me & Forgot Password */}
                  <View style={styles.optionsRow}>
                    <TouchableOpacity 
                      style={styles.rememberRow} 
                      onPress={() => setRememberMe(!rememberMe)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={rememberMe ? "checkbox" : "square-outline"} 
                        size={18} 
                        color={rememberMe ? colors.primary : colors.textMuted} 
                      />
                      <Text style={[styles.rememberText, { color: colors.textSecondary }]}>
                        Lembrar de mim
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => showError('Para redefinir sua senha, solicite ao administrador.')}
                      onMouseEnter={() => setForgotHovered(true)}
                      onMouseLeave={() => setForgotHovered(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.forgotPasswordLink, 
                        { color: colors.primary },
                        forgotHovered ? { textDecorationLine: 'underline', color: colors.primaryHover } : null
                      ]}>
                        Esqueci a senha
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Main Login Button */}
                  <TouchableOpacity
                    style={[
                      styles.loginBtn, 
                      loading && styles.loginBtnDisabled, 
                      { width: '100%', marginTop: 8 },
                      buttonHovered && !loading ? { backgroundColor: colors.primaryHover, transform: [{ scale: 1.015 }] } : null
                    ]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.85}
                    onMouseEnter={() => setButtonHovered(true)}
                    onMouseLeave={() => setButtonHovered(false)}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.loginText}>
                        Entrar
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Footer text */}
                  <Text style={[styles.desktopRightFooter, { color: colors.textMuted, marginTop: 24 }]}>
                    Velotrack Fleet & Telematics Enterprise © 2026
                  </Text>
                </Animated.View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>

        </View>

      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Floating Theme Button for Mobile */}
      <TouchableOpacity 
        style={styles.themeToggleFloatingMobile} 
        onPress={toggleTheme}
        activeOpacity={0.8}
      >
        <Ionicons 
          name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} 
          size={18} 
          color={colors.text} 
        />
      </TouchableOpacity>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Logo Brand */}
          <Animated.View style={[styles.logoBox, { opacity: mobileFade, transform: [{ translateY: mobileSlide }] }]}>
            <View style={[styles.glowDot, { backgroundColor: 'rgba(230,0,80,0.06)' }]} />
            <Text style={styles.logoText}>
              <Text style={{ color: colors.text }}>VELO</Text>
              <Text style={{ color: colors.primary }}>TRACK</Text>
            </Text>
            <Text style={styles.logoSub}>SISTEMA DE GESTÃO TÉCNICA</Text>
          </Animated.View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.errorSoft, borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Card Surface */}
          <Animated.View style={[styles.card, { opacity: mobileFade, transform: [{ translateY: mobileSlide }], backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.cardHeaderTitle}>
              Acesse sua conta
            </Text>
            <Text style={styles.cardHeaderSub}>
              Entre com suas credenciais para continuar
            </Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>E-mail</Text>
              <View style={[
                styles.inputWrap, 
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                email ? { borderColor: colors.primary, backgroundColor: 'rgba(230,0,80,0.02)' } : null
              ]}>
                <Ionicons name="mail-outline" size={16} color={email ? colors.primary : colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="seu@email.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Senha de acesso</Text>
              </View>
              <View style={[
                styles.inputWrap, 
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                password ? { borderColor: colors.primary, backgroundColor: 'rgba(230,0,80,0.02)' } : null
              ]}>
                <Ionicons name="lock-closed-outline" size={16} color={password ? colors.primary : colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text, flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShow(!show)} style={styles.eye}>
                  <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <View style={styles.loginRow}>
                  <Text style={styles.loginText}>
                    ENTRAR
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

            {/* Minimal footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>VELOTRACK PLATFORM © 2026</Text>
            <Text style={styles.footerSubText}>SaaS Enterprise Technology</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: spacing['2xl'],
    justifyContent: 'center',
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  logoBox: { alignItems: 'center', marginBottom: 38, position: 'relative' },
  glowDot: {
    position: 'absolute',
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(99,91,255,0.06)',
    zIndex: -1,
  },
  logoText: {
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : 'monospace',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 5,
    textShadowColor: 'rgba(230, 0, 80, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  logoSub: {
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : 'monospace',
    fontSize: 8,
    color: colors.primary,
    letterSpacing: 4,
    marginTop: 10,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.errorSoft, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.xl,
  },
  errorText: { color: colors.error, fontSize: 13, fontWeight: '600', flex: 1 },
  card: {
    backgroundColor: colors.card, borderRadius: radii.lg,
    padding: spacing['2xl'], borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20,
  },
  cardHeaderTitle: {
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : 'sans-serif-bold',
    fontSize: 18, fontWeight: '800', color: colors.text,
    letterSpacing: -0.3, marginBottom: 4,
  },
  cardHeaderSub: {
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : 'sans-serif',
    fontSize: 13, color: colors.textMuted,
    marginBottom: spacing['2xl'], fontWeight: '500',
  },
  field: { marginBottom: spacing.xl },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: {
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : 'sans-serif-bold',
    color: colors.textMuted, fontSize: 10, fontWeight: '800',
    marginBottom: spacing.sm, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, paddingHorizontal: spacing.md, height: 48,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, color: colors.text, fontSize: 14, height: '100%', outlineStyle: 'none',
  },
  eye: { padding: 5, marginLeft: 6 },
  loginBtn: {
    backgroundColor: colors.primary, borderRadius: radii.md, height: 48,
    justifyContent: 'center', alignItems: 'center', marginTop: spacing.xs,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  loginText: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  footer: { alignItems: 'center', paddingTop: 40, paddingBottom: 10 },
  footerText: { color: colors.text, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  footerSubText: { color: colors.textMuted, fontSize: 9, fontWeight: '500', letterSpacing: 1, marginTop: 3 },

  // Desktop Split Layout Styles
  desktopContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: Platform.OS === 'web' ? '100vh' : '100%',
    width: Platform.OS === 'web' ? '100vw' : '100%',
    position: 'relative',
    padding: spacing['2xl'],
  },
  desktopCardFrame: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 1100,
    height: 660,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: colors.isDark ? 0.4 : 0.08,
    shadowRadius: 36,
    elevation: 10,
  },
  themeToggleFloating: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  themeToggleFloatingMobile: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  desktopLeftContainer: {
    flex: 1.5,
    height: '100%',
    overflow: 'hidden',
  },
  desktopLeft: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  desktopLeftOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 7, 18, 0.32)',
  },
  leftFloatingWatermark: {
    position: 'absolute',
    top: 40,
    left: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(9, 10, 15, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#005',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  watermarkText: {
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : 'sans-serif-bold',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  leftFloatingBottom: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    backgroundColor: 'rgba(9, 10, 15, 0.78)',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px) saturate(140%)',
      }
    })
  },
  leftFloatingBottomTitle: {
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : 'sans-serif-bold',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  leftFloatingBottomDesc: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : 'sans-serif',
    color: 'rgba(255, 255, 255, 0.68)',
    fontSize: 12,
    lineHeight: 18,
  },
  rightHeaderBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  brandLogoIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(230, 0, 80, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 0, 80, 0.25)',
  },
  rightBrandText: {
    fontFamily: Platform.OS === 'web' ? 'Orbitron, sans-serif' : 'monospace',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  desktopRight: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  desktopRightScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 44,
  },
  desktopFormCol: {
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
  },
  desktopSecureTitle: {
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : 'sans-serif-bold',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  desktopSecureSub: {
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : 'sans-serif',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 28,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  forgotPasswordLink: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberText: {
    fontSize: 12,
    fontWeight: '600',
  },
  desktopRightFooter: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  }
});
