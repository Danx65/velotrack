import { Tabs, useRouter, useSegments } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, Platform } from 'react-native';
import { spacing, radii } from '../../src/theme/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeColors } from '../../src/theme';

const TABS = [
  { name: 'index',         title: 'Visão geral',    icon: 'view-dashboard-outline',  active: 'view-dashboard' },
  { name: 'criar-servico', title: 'Ordens',          icon: 'plus-circle-outline',     active: 'plus-circle' },
  { name: 'agenda',        title: 'Agenda',          icon: 'calendar-blank-outline',  active: 'calendar' },
  { name: 'tecnicos',      title: 'Técnicos',        icon: 'account-group-outline',   active: 'account-group' },
  { name: 'configuracoes', title: 'Configurações',   icon: 'cog-outline',             active: 'cog' },
];

const NAV_SECTIONS = [
  {
    title: null,
    tabs: ['index'],
  },
  {
    title: 'Operacional',
    tabs: ['criar-servico', 'agenda', 'tecnicos'],
  },
  {
    title: 'Sistema',
    tabs: ['configuracoes'],
  },
];

export default function AdminLayout() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { width } = useWindowDimensions();
  const router = useRouter();
  const segments = useSegments();
  const { profile, signOut } = useAuth();

  const isDesktop = Platform.OS === 'web' && width > 768;

  const currentTab = segments.includes('criar-servico') ? 'criar-servico' :
                     segments.includes('tecnicos')      ? 'tecnicos'      :
                     segments.includes('agenda')        ? 'agenda'        :
                     segments.includes('configuracoes') ? 'configuracoes' : 'index';

  const handleTabPress = (name) => {
    if (name === 'index') {
      router.replace('/(admin)');
    } else {
      router.replace(`/(admin)/${name}`);
    }
  };

  const initials = (profile?.nome || 'AD')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      {isDesktop && (
        <View style={styles.sidebar}>

          {/* ── Logo / Branding ── */}
          <View style={styles.brandBox}>
            <View style={styles.brandLogoRow}>
              <View style={styles.brandIconWrap}>
                <MaterialCommunityIcons name="lightning-bolt" size={16} color="#E60050" />
              </View>
              <Text style={styles.brandText}>
                <Text style={{ color: colors.text }}>VELO</Text>
                <Text style={{ color: '#E60050' }}>TRACK</Text>
              </Text>
            </View>
            <View style={styles.brandDivider} />
          </View>

          {/* ── Navegação por seções ── */}
          <View style={styles.navScroll}>
            {NAV_SECTIONS.map((section, si) => (
              <View key={si} style={styles.navSection}>
                {section.title && (
                  <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
                )}
                {section.tabs.map((tabName) => {
                  const tab = TABS.find(t => t.name === tabName);
                  if (!tab) return null;
                  const active = currentTab === tab.name;
                  return (
                    <Pressable
                      key={tab.name}
                      onPress={() => handleTabPress(tab.name)}
                      style={({ pressed, hovered }) => [
                        styles.navItem,
                        active && styles.navItemActive,
                        (pressed || hovered) && !active && styles.navItemHover,
                      ]}
                    >
                      {/* Indicador lateral ativo */}
                      {active && <View style={styles.activeBar} />}

                      <MaterialCommunityIcons
                        name={active ? tab.active : tab.icon}
                        size={18}
                        color={active ? '#E60050' : colors.textMuted}
                      />
                      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                        {tab.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {/* ── Perfil + Logout ── */}
          <View style={styles.profileBox}>
            <View style={styles.profileRow}>
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.profileMeta}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {profile?.nome || 'Administrador'}
                </Text>
                <Text style={styles.profileRole} numberOfLines={1}>
                  {profile?.cargo || 'Admin'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={async () => { await signOut(); }}
              style={({ pressed, hovered }) => [
                styles.btnSignOut,
                (pressed || hovered) && { backgroundColor: colors.errorSoft }
              ]}
            >
              <MaterialCommunityIcons name="logout" size={15} color={colors.error} />
              <Text style={styles.signOutText}>Encerrar sessão</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Conteúdo principal ── */}
      <View style={styles.mainContent}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              display: isDesktop ? 'none' : 'flex',
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: 64,
              paddingBottom: 8,
              paddingTop: 8,
              elevation: 8,
              shadowOpacity: 0.06,
            },
            tabBarActiveTintColor: '#E60050',
            tabBarInactiveTintColor: colors.textMuted,
            tabBarLabelStyle: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
            tabBarHideOnKeyboard: true,
          }}
        >
          {TABS.map((tab) => (
            <Tabs.Screen
              key={tab.name}
              name={tab.name}
              options={{
                title: tab.title,
                tabBarIcon: ({ color, focused }) => (
                  <MaterialCommunityIcons
                    name={focused ? tab.active : tab.icon}
                    size={20}
                    color={color}
                  />
                ),
              }}
            />
          ))}
          <Tabs.Screen name="historico" options={{ href: null }} />
          <Tabs.Screen name="suporte"   options={{ href: null }} />
        </Tabs>
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.bg,
  },

  /* ── Sidebar ── */
  sidebar: {
    width: 240,
    backgroundColor: colors.surface,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    height: '100%',
    // Sombra sutil à direita (separação do conteúdo)
    ...Platform.select({
      web: {
        boxShadow: colors.isDark
          ? '2px 0 12px rgba(0,0,0,0.25)'
          : '2px 0 12px rgba(31,41,55,0.06)',
        zIndex: 10,
      },
    }),
  },

  /* ── Brand ── */
  brandBox: {
    marginBottom: spacing.xl,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.lg,
  },
  brandIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radii.md,
    backgroundColor: 'rgba(230,0,80,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 3,
  },
  brandDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  /* ── Nav ── */
  navScroll: {
    flex: 1,
    gap: 4,
  },
  navSection: {
    marginBottom: spacing.lg,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    paddingHorizontal: spacing.md,
    marginBottom: 4,
    marginTop: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  navItemActive: {
    backgroundColor: 'rgba(230,0,80,0.06)',
  },
  navItemHover: {
    backgroundColor: colors.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(17,24,39,0.03)',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
    backgroundColor: '#E60050',
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    flex: 1,
  },
  navLabelActive: {
    color: colors.text,
    fontWeight: '700',
  },

  /* ── Perfil ── */
  profileBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: 'rgba(230,0,80,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(230,0,80,0.18)',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E60050',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  profileRole: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  btnSignOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radii.md,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
    backgroundColor: 'transparent',
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },

  /* ── Main ── */
  mainContent: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
