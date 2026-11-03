import { useState, useRef, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  Text,
  Animated,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { technicianHeroBase64 } from '../src/assets/images/heroBase64';

function VelotrackLogoMark({ light = false }) {
  const primaryColor = '#BE226C';
  const textColor = light ? '#FFFFFF' : '#0F172A';

  if (Platform.OS === 'web') {
    return (
      <View style={styles.logoMarkContainer}>
        <svg width="22" height="17" viewBox="0 0 28 20" fill="none" style={{ display: 'inline-block' }}>
          <path d="M1 2L8 2L13 9L6 9Z" fill={primaryColor} />
          <path d="M18 2L25 2L13 18L7 18L15 8L12 8Z" fill={primaryColor} />
        </svg>
        <Text style={[styles.brandTitleText, { color: textColor }]}>VELOTRACK</Text>
      </View>
    );
  }

  return (
    <View style={styles.logoMarkContainer}>
      <Ionicons name="flash-sharp" size={18} color={primaryColor} />
      <Text style={[styles.brandTitleText, { color: textColor }]}>VELOTRACK</Text>
    </View>
  );
}

export default function LoginScreen() {
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
  const [forgotHovered, setForgotHovered] = useState(false);

  const isDesktop = Platform.OS === 'web' && width > 840;

  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFade, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(cardSlide, { toValue: 0, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, []);

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
      <View style={styles.desktopContainer}>
        <Animated.View
          style={[
            styles.desktopCardFrame,
            {
              opacity: cardFade,
              transform: [{ translateY: cardSlide }],
            },
          ]}
        >
          {/* Left Side: Professional Workshop Technician Panel */}
          <View style={styles.desktopLeft}>
            <ImageBackground
              source={{ uri: technicianHeroBase64 }}
              style={styles.heroBackground}
              resizeMode="cover"
            >
              {/* Vignette Overlay for Readability */}
              <View style={styles.heroOverlayGradient} />

              {/* Top Bar on Left Panel */}
              <View style={styles.heroTopBar}>
                <VelotrackLogoMark light />

                <View style={styles.heroTopRightSecurity}>
                  <Text style={styles.heroSecurityText}>MAIS SEGURANÇA</Text>
                  <Text style={styles.heroSecurityText}>EM TODOS OS KM.</Text>
                  <View style={styles.heroPinkUnderline} />
                </View>
              </View>

              {/* Bottom Operational Info */}
              <View style={styles.heroBottomContainer}>
                <View style={styles.heroAccentPill} />

                <Text style={styles.heroHeadingTitle}>
                  OPERAÇÃO EM CAMPO,{'\n'}COM CLAREZA.
                </Text>

                <Text style={styles.heroHeadingDesc}>
                  Organize sua rota, execute instalações e finalize cada atendimento com precisão.
                </Text>

                <View style={styles.heroTagsRow}>
                  <View style={styles.heroTagBadge}>
                    <Ionicons name="location-sharp" size={13} color="#BE226C" />
                    <Text style={styles.heroTagText}>ROTA DO DIA</Text>
                  </View>

                  <View style={styles.heroTagBadge}>
                    <Ionicons name="construct-sharp" size={13} color="#BE226C" />
                    <Text style={styles.heroTagText}>INSTALAÇÕES</Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* Right Side: Acesso do Técnico Form */}
          <View style={styles.desktopRight}>
            <KeyboardAvoidingView behavior="padding" style={styles.flex}>
              <ScrollView
                contentContainerStyle={styles.desktopRightScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Brand Header */}
                <View style={styles.rightLogoRow}>
                  <VelotrackLogoMark />
                </View>

                {/* Form Title & Subtitle */}
                <Text style={styles.pageTitle}>Acesso do técnico</Text>
                <Text style={styles.pageSubtitle}>
                  Entre para consultar sua rota e executar os atendimentos do dia.
                </Text>

                {/* Error Banner */}
                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={16} color="#E11D48" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* E-mail Field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>E-MAIL</Text>
                  <View
                    style={[
                      styles.inputBox,
                      emailFocused && styles.inputBoxFocused,
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color="#94A3B8"
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="seu@email.com"
                      placeholderTextColor="#94A3B8"
                      value={email}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      onChangeText={(t) => {
                        setEmail(t);
                        setError('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Senha Field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>SENHA</Text>
                  <View
                    style={[
                      styles.inputBox,
                      passwordFocused && styles.inputBoxFocused,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color="#94A3B8"
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      onChangeText={(t) => {
                        setPassword(t);
                        setError('');
                      }}
                      secureTextEntry={!show}
                      autoCapitalize="none"
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShow(!show)}
                      style={styles.eyeBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={show ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Helper Row: Lembrar de mim & Esqueci a senha */}
                <View style={styles.helperRow}>
                  <TouchableOpacity
                    style={styles.rememberRow}
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.customCheckbox, rememberMe && styles.customCheckboxChecked]}>
                      {rememberMe && <Ionicons name="checkmark-sharp" size={12} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.rememberText}>Lembrar de mim</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => showError('Para redefinir sua senha, solicite ao administrador.')}
                    onMouseEnter={() => setForgotHovered(true)}
                    onMouseLeave={() => setForgotHovered(false)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.forgotText,
                        forgotHovered && styles.forgotTextHovered,
                      ]}
                    >
                      Esqueci a senha
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    loading && styles.submitBtnDisabled,
                    buttonHovered && !loading && styles.submitBtnHovered,
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.88}
                  onMouseEnter={() => setButtonHovered(true)}
                  onMouseLeave={() => setButtonHovered(false)}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Entrar</Text>
                      <Ionicons name="arrow-forward" size={17} color="#FFFFFF" style={styles.submitBtnIcon} />
                    </>
                  )}
                </TouchableOpacity>

                {/* Footer Brand Line */}
                <View style={styles.footerRow}>
                  <Ionicons name="person-outline" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
                  <Text style={styles.footerText}>VELOTRACK FIELD OPERATIONS</Text>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Animated.View>
      </View>
    );
  }

  // Mobile layout
  return (
    <SafeAreaView style={styles.mobileSafe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.mobileScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Mobile Top Hero Header */}
          <View style={styles.mobileHeroBox}>
            <ImageBackground
              source={{ uri: technicianHeroBase64 }}
              style={styles.mobileHeroImage}
              resizeMode="cover"
            >
              <View style={styles.heroOverlayGradient} />
              <View style={styles.mobileHeroContent}>
                <VelotrackLogoMark light />
                <Text style={styles.mobileHeroTitle}>OPERAÇÃO EM CAMPO</Text>
              </View>
            </ImageBackground>
          </View>

          {/* Mobile Form Sheet */}
          <View style={styles.mobileFormCard}>
            <Text style={styles.pageTitle}>Acesso do técnico</Text>
            <Text style={styles.pageSubtitle}>
              Entre para consultar sua rota e executar os atendimentos do dia.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#E11D48" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* E-mail */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>E-MAIL</Text>
              <View
                style={[
                  styles.inputBox,
                  emailFocused && styles.inputBoxFocused,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color="#94A3B8"
                  style={styles.inputLeadingIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="seu@email.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  onChangeText={(t) => {
                    setEmail(t);
                    setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Senha */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>SENHA</Text>
              <View
                style={[
                  styles.inputBox,
                  passwordFocused && styles.inputBoxFocused,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#94A3B8"
                  style={styles.inputLeadingIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onChangeText={(t) => {
                    setPassword(t);
                    setError('');
                  }}
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShow(!show)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={show ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Options */}
            <View style={styles.helperRow}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.customCheckbox, rememberMe && styles.customCheckboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark-sharp" size={12} color="#FFFFFF" />}
                </View>
                <Text style={styles.rememberText}>Lembrar de mim</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => showError('Para redefinir sua senha, solicite ao administrador.')}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>Esqueci a senha</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                loading && styles.submitBtnDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Entrar</Text>
                  <Ionicons name="arrow-forward" size={17} color="#FFFFFF" style={styles.submitBtnIcon} />
                </>
              )}
            </TouchableOpacity>

            <View style={[styles.footerRow, { marginTop: 24, marginBottom: 8 }]}>
              <Ionicons name="person-outline" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
              <Text style={styles.footerText}>VELOTRACK FIELD OPERATIONS</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  desktopContainer: {
    flex: 1,
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#8A909C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    ...Platform.select({
      web: {
        backgroundImage: 'radial-gradient(circle at 50% 45%, #9AA1AD 0%, #757D8B 100%)',
      },
    }),
  },
  desktopCardFrame: {
    width: '100%',
    maxWidth: 1040,
    height: 570,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    ...Platform.select({
      web: {
        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4), 0 0 1px 1px rgba(255, 255, 255, 0.3)',
      },
      default: {
        elevation: 20,
      },
    }),
  },
  desktopLeft: {
    flex: 1.38,
    height: '100%',
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  heroBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    padding: 28,
  },
  heroOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 8, 16, 0.42)',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(180deg, rgba(5, 8, 16, 0.6) 0%, rgba(5, 8, 16, 0.2) 35%, rgba(5, 8, 16, 0.5) 70%, rgba(5, 8, 16, 0.88) 100%)',
      },
    }),
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  heroTopRightSecurity: {
    alignItems: 'flex-end',
  },
  heroSecurityText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.8,
    textAlign: 'right',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, system-ui, sans-serif' : undefined,
  },
  heroPinkUnderline: {
    width: 32,
    height: 2.5,
    backgroundColor: '#BE226C',
    borderRadius: 2,
    marginTop: 6,
  },
  heroBottomContainer: {
    zIndex: 2,
    paddingBottom: 6,
  },
  heroAccentPill: {
    width: 36,
    height: 3.5,
    backgroundColor: '#BE226C',
    borderRadius: 2,
    marginBottom: 12,
  },
  heroHeadingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
    lineHeight: 27,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, system-ui, sans-serif' : undefined,
  },
  heroHeadingDesc: {
    fontSize: 12.5,
    color: '#CBD5E1',
    lineHeight: 18,
    maxWidth: 410,
    marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, system-ui, sans-serif' : undefined,
  },
  heroTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  heroTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, system-ui, sans-serif' : undefined,
  },
  desktopRight: {
    flex: 1,
    height: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    paddingVertical: 36,
    justifyContent: 'center',
  },
  desktopRightScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  rightLogoRow: {
    marginBottom: 24,
  },
  logoMarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitleText: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, system-ui, sans-serif' : undefined,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.4,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, system-ui, sans-serif' : undefined,
  },
  pageSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 26,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, system-ui, sans-serif' : undefined,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#BE123C',
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, system-ui, sans-serif' : undefined,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    ...Platform.select({
      web: {
        transition: 'all 0.15s ease',
      },
    }),
  },
  inputBoxFocused: {
    borderColor: '#BE226C',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(190, 34, 108, 0.12)',
      },
    }),
  },
  inputLeadingIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    paddingVertical: 0,
    height: '100%',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  eyeBtn: {
    padding: 6,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 22,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customCheckbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  customCheckboxChecked: {
    backgroundColor: '#BE226C',
    borderColor: '#BE226C',
  },
  rememberText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#BE226C',
  },
  forgotTextHovered: {
    textDecorationLine: 'underline',
    color: '#9F1239',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BE226C',
    height: 46,
    borderRadius: 10,
    width: '100%',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      },
    }),
  },
  submitBtnHovered: {
    backgroundColor: '#A81A5D',
    ...Platform.select({
      web: {
        transform: [{ scale: 1.01 }],
      },
    }),
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    marginRight: 6,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, system-ui, sans-serif' : undefined,
  },
  submitBtnIcon: {
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, system-ui, sans-serif' : undefined,
  },

  // Mobile Styles
  mobileSafe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mobileScroll: {
    flexGrow: 1,
  },
  mobileHeroBox: {
    width: '100%',
    height: 220,
    backgroundColor: '#0F172A',
  },
  mobileHeroImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  mobileHeroContent: {
    zIndex: 2,
    gap: 6,
  },
  mobileHeroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  mobileFormCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    ...Platform.select({
      web: {
        boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.06)',
      },
      default: {
        elevation: 8,
      },
    }),
  },
});
