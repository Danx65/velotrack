import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { radii, spacing } from '../../src/theme/colors';
import { useThemeColors } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';
import { servicosService } from '../../src/services/servicos';
import { tecnicosService } from '../../src/services/tecnicos';
import { historyService } from '../../src/services/history';
import { useAuth } from '../../src/contexts/AuthContext';
import { useFocusEffect } from 'expo-router';

const DAYS_OF_WEEK = ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÁB.'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function CalendarScreen() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  const { user } = useAuth();

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month'); // 'month', 'week', 'day'
  const [services, setServices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTech, setSelectedTech] = useState('all'); // id or 'all'
  const [selectedStatus, setSelectedStatus] = useState('all'); // status or 'all'

  // Rescheduling modal
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('14:00');
  const [newTech, setNewTech] = useState('');
  const [savingAction, setSavingAction] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch active technicians
      const techs = await tecnicosService.listActive();
      setTechnicians(techs);

      // Fetch all services across Supabase (direct query for calendar flexibility)
      const { data, error } = await supabase
        .from('servicos')
        .select('*, users(nome)');
      
      if (error) throw error;

      // Wrap list elements with metadata parse
      const formatted = (data || []).map(item => {
        let meta = item.metadata;
        if (!meta || Object.keys(meta).length === 0) {
          if (item.checklist && !Array.isArray(item.checklist)) {
            const c = item.checklist;
            meta = {
              schedule: {
                date: c.date || (item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : ''),
                time: c.time || '14:00',
                duration: c.duration || '01:30',
                repType: c.repType || 'Não se repete',
                repDays: c.repDays || [],
              },
              location: {
                endereco: item.endereco || c.endereco || '',
                cidade: c.cidade || '',
                googleMapsUrl: c.googleMapsUrl || '',
                latitude: c.latitude || '-23.55052',
                longitude: c.longitude || '-46.63330',
              },
              billing: {
                valServico: c.valServico || '0,00',
                formaPagamento: c.formaPagamento || 'Pix',
                isFaturado: c.isFaturado ?? true,
                isPago: c.isPago ?? false,
              },
              notifications: {
                satisfactionSurvey: c.satisfactionSurvey ?? true,
                whatsappOS: c.whatsappOS ?? true,
                notifAgendamento: c.notifAgendamento ?? true,
                notifConclusao: c.notifConclusao ?? true,
                notifPush: c.notifPush ?? true,
                externalCode: c.externalCode || '',
                keyword: c.keyword || '',
              },
              attachments: c.attachments || [],
              equipment: c.equipments || c.equipment || [],
            };
          } else {
            meta = {
              schedule: { date: '', time: '14:00', duration: '01:30', repType: 'Não se repete', repDays: [] },
              location: { endereco: item.endereco || '', cidade: '', googleMapsUrl: '', latitude: '-23.55052', longitude: '-46.63330' },
              billing: { valServico: '0,00', formaPagamento: 'Pix', isFaturado: true, isPago: false },
              notifications: { satisfactionSurvey: true, whatsappOS: true, notifAgendamento: true, notifConclusao: true, notifPush: true, externalCode: '', keyword: '' },
              attachments: [],
              equipment: [],
            };
          }
        }
        return {
          ...item,
          metadata: meta
        };
      });

      setServices(formatted);
    } catch (err) {
      console.error('Error loading calendar content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Parse custom date strings like "30/05/2026" or "2026-05-30" to Date objects helper
  const parseServiceDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateStr);
  };

  // Check scheduling conflicts helper
  const checkServiceConflict = (dateStr, timeStr, techId, ignoreServiceId = null) => {
    if (!techId) return false;
    return services.some(srv => {
      if (srv.id === ignoreServiceId) return false;
      const srvDate = srv.metadata?.schedule?.date;
      const srvTime = srv.metadata?.schedule?.time;
      const srvTech = srv.technician_id;
      return srvTech === techId && srvDate === dateStr && srvTime === timeStr;
    });
  };

  // Filters logic
  const filteredServices = services.filter(srv => {
    const belongsToTech = selectedTech === 'all' || srv.technician_id === selectedTech;
    const matchesStatus = selectedStatus === 'all' || srv.status === selectedStatus;
    return belongsToTech && matchesStatus;
  });

  // Month calculator helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  // Navigation handlers
  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewType === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewType === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handlePrev = () => {
    const prev = new Date(currentDate);
    if (viewType === 'month') {
      prev.setMonth(prev.getMonth() - 1);
    } else if (viewType === 'week') {
      prev.setDate(prev.getDate() - 7);
    } else {
      prev.setDate(prev.getDate() - 1);
    }
    setCurrentDate(prev);
  };

  // Open reschedule details panel
  const handleOpenReschedule = (service) => {
    setSelectedService(service);
    setNewDate(service.metadata?.schedule?.date || new Date().toLocaleDateString('pt-BR'));
    setNewTime(service.metadata?.schedule?.time || '14:00');
    setNewTech(service.technician_id || '');
    setRescheduleModalVisible(true);
  };

  // Reschedule save handler
  const handleSaveReschedule = async () => {
    if (!selectedService) return;

    // Valida data DD/MM/AAAA
    const dateMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(newDate);
    if (!dateMatch) {
      alert('Data inválida. Use o formato DD/MM/AAAA (ex.: 14/08/2026).');
      return;
    }
    const dDay = parseInt(dateMatch[1], 10);
    const dMonth = parseInt(dateMatch[2], 10);
    const dYear = parseInt(dateMatch[3], 10);
    const parsedDate = new Date(dYear, dMonth - 1, dDay);
    if (parsedDate.getFullYear() !== dYear || parsedDate.getMonth() !== dMonth - 1 || parsedDate.getDate() !== dDay) {
      alert('Data inválida. A data informada não existe no calendário.');
      return;
    }

    // Valida hora HH:MM
    const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(newTime);
    if (!timeMatch) {
      alert('Hora inválida. Use o formato HH:MM (ex.: 14:30).');
      return;
    }

    setSavingAction(true);
    try {
      const updatedMetadata = {
        ...selectedService.metadata,
        schedule: {
          ...selectedService.metadata?.schedule,
          date: newDate,
          time: newTime,
        }
      };

      await servicosService.update(selectedService.id, {
        technician_id: newTech || null,
        metadata: updatedMetadata,
        user_id: user?.id
      });

      // Log history action for timeline tracking
      const techName = technicians.find(t => t.id === newTech)?.nome || 'Sem técnico';
      await historyService.log(
        selectedService.id,
        user?.id,
        historyService.ACTIONS.EDITED,
        `Reagendamento: Data=${newDate}, Hora=${newTime}, Técnico=${techName}`
      );

      setRescheduleModalVisible(false);
      loadData();
    } catch (err) {
      alert('Erro ao reorganizar OS: ' + err.message);
    } finally {
      setSavingAction(false);
    }
  };

  // Get status color helper
  const getStatusColor = (status) => {
    switch (status) {
      case 'concluido': return '#38A169'; // Success
      case 'em_andamento': return '#3182CE'; // Blue
      default: return '#E53E3E'; // Pending (Redish/Amber)
    }
  };

  // --- RENDERING VIEWS ---

  // Component Month View
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const totalDays = getDaysInMonth(year, month);
    const startOffset = getFirstDayOfMonth(year, month);

    const monthDays = [];

    // Fill previous month trailing days
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
    for (let i = startOffset - 1; i >= 0; i--) {
      monthDays.push(new Date(prevMonthYear, prevMonth, daysInPrevMonth - i));
    }

    // Fill current month days
    for (let i = 1; i <= totalDays; i++) {
      monthDays.push(new Date(year, month, i));
    }

    // Fill next month leading days to complete full week rows (exactly 42 cells or 35 if it fits to make uniform layout)
    const totalCellsUsed = monthDays.length;
    const targetCellCount = totalCellsUsed <= 35 ? 35 : 42;
    const remainingCells = targetCellCount - totalCellsUsed;

    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    for (let i = 1; i <= remainingCells; i++) {
      monthDays.push(new Date(nextMonthYear, nextMonth, i));
    }

    // Split into chunk weeks
    const weeks = [];
    let week = [];
    monthDays.forEach((day, index) => {
      week.push(day);
      if (week.length === 7 || index === monthDays.length - 1) {
        while (week.length < 7) {
          week.push(null);
        }
        weeks.push(week);
        week = [];
      }
    });

    return (
      <View style={[styles.gridContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Week Headers */}
        <View style={[styles.gridHeaderRow, { backgroundColor: colors.surfaceElevated, borderBottomColor: colors.border }]}>
          {DAYS_OF_WEEK.map((day, idx) => (
            <View key={idx} style={styles.gridHeaderCell}>
              <Text style={styles.gridHeaderCellText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.gridBody}>
          {weeks.map((wk, weekIdx) => (
            <View key={weekIdx} style={[styles.gridWeekRow, { borderBottomColor: colors.border }]}>
              {wk.map((day, dayIdx) => {
                if (!day) {
                  return <View key={dayIdx} style={[styles.gridDayCell, { borderRightColor: colors.border, backgroundColor: colors.isDark ? 'rgba(0,0,0,0.15)' : '#F3F4F6' }]} />;
                }

                const dayStr = day.toLocaleDateString('pt-BR');
                const matchedSvs = filteredServices.filter(s => s.metadata?.schedule?.date === dayStr);
                const isToday = day.toDateString() === new Date().toDateString();
                const isCurrentMonth = day.getMonth() === month;

                return (
                  <View 
                    key={dayIdx} 
                    style={[
                      styles.gridDayCell, 
                      { borderRightColor: colors.border }, 
                      isToday && { backgroundColor: colors.primarySoft },
                      !isCurrentMonth && { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.015)' : '#F9FAFB' }
                    ]}
                  >
                    <Text style={[
                      styles.gridDayNumber, 
                      { color: isCurrentMonth ? colors.textMuted : colors.textMuted + '66' }, 
                      isToday && styles.gridDayNumberToday
                    ]}>
                      {day.getDate()}
                    </Text>
                    
                    <ScrollView style={styles.gridDayContentScroll} showsVerticalScrollIndicator={false}>
                      {matchedSvs.map(s => {
                        const hasHourConflict = checkServiceConflict(dayStr, s.metadata?.schedule?.time, s.technician_id, s.id);
                        return (
                          <Pressable
                            key={s.id}
                            onPress={() => handleOpenReschedule(s)}
                            style={styles.compactAppointmentRow}
                          >
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(s.status) }]} />
                            <Text style={[styles.compactAppointmentTime, { color: getStatusColor(s.status) }]} numberOfLines={1}>
                              {s.metadata?.schedule?.time}
                            </Text>
                            <Text style={[styles.compactAppointmentText, { color: isCurrentMonth ? colors.text : colors.textMuted }]} numberOfLines={1}>
                              {s.cliente} - {s.users?.nome?.split(' ')[0] || 'S/ Técnico'}
                            </Text>
                            {hasHourConflict && (
                              <MaterialCommunityIcons name="alert-decagram" size={10} color="#D69E2E" style={{ marginLeft: 2 }} />
                            )}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Component Week View
  const renderWeekView = () => {
    // Calculate week bounds containing current date
    const weekDays = [];
    const temp = new Date(currentDate);
    const dayIndex = temp.getDay();
    temp.setDate(temp.getDate() - dayIndex); // Move to nearest Sunday

    for (let i = 0; i < 7; i++) {
      weekDays.push(new Date(temp));
      temp.setDate(temp.getDate() + 1);
    }

    return (
      <View style={[styles.weekContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.weekHeaderRow, { backgroundColor: colors.surfaceElevated, borderBottomColor: colors.border }]}>
          {weekDays.map((day, idx) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <View key={idx} style={[styles.weekHeadCell, { borderRightColor: colors.border }, isToday && { backgroundColor: colors.primarySoft }]}>
                <Text style={styles.weekHeadDayName}>{DAYS_OF_WEEK[day.getDay()]}</Text>
                <Text style={[styles.weekHeadDayNum, { color: colors.text }, isToday && { color: colors.primary }]}>{day.getDate()}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.weekBodyRow}>
          {weekDays.map((day, idx) => {
            const dayStr = day.toLocaleDateString('pt-BR');
            const matchedSvs = filteredServices.filter(s => s.metadata?.schedule?.date === dayStr);

            return (
              <View key={idx} style={[styles.weekColumn, { borderRightColor: colors.border }]}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.weekColScroll}>
                  {matchedSvs.length === 0 ? (
                    <Text style={[styles.noWeekItemsText, { color: colors.textMuted }]}>Sem OS</Text>
                  ) : (
                    matchedSvs.map(s => {
                      const hasHourConflict = checkServiceConflict(dayStr, s.metadata?.schedule?.time, s.technician_id, s.id);
                      return (
                        <Pressable
                          key={s.id}
                          onPress={() => handleOpenReschedule(s)}
                          style={[styles.weekServiceCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: getStatusColor(s.status) }]}
                        >
                          <View style={styles.weekCardHeader}>
                            <Text style={[styles.weekCardTime, { color: colors.textSecondary }]}>{s.metadata?.schedule?.time}</Text>
                            {hasHourConflict && (
                              <View style={styles.conflictHeaderBadge}>
                                <Text style={styles.conflictHeaderBadgeText}>CONFLITO</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.weekCardClient, { color: colors.text }]} numberOfLines={1}>{s.cliente}</Text>
                          <View style={styles.weekCardFooter}>
                            <Feather name="user" size={10} color={colors.textMuted} style={{ marginRight: 2 }} />
                            <Text style={styles.weekCardTech} numberOfLines={1}>
                              {s.users?.nome || 'Não atribuído'}
                            </Text>
                          </View>
                          <Text style={[styles.weekCardVehicle, { color: colors.textMuted }]} numberOfLines={1}>{s.veiculo} • {s.placa}</Text>
                        </Pressable>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Component Day View (Schedules & Slots)
  const renderDayView = () => {
    const dayStr = currentDate.toLocaleDateString('pt-BR');
    const matchedSvs = filteredServices.filter(s => s.metadata?.schedule?.date === dayStr);
    
    // Generate static hours list 08:00 -> 18:00
    const workingHours = [
      '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];

    return (
      <View style={[styles.dayViewOuter, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {matchedSvs.length === 0 ? (
          <View style={styles.emptyDayContainer}>
            <MaterialCommunityIcons name="calendar-clock" size={48} color={colors.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
            <Text style={[styles.emptyDayTitle, { color: colors.text }]}>Sem Ordens de Serviço</Text>
            <Text style={styles.emptyDaySubtitle}>Não há agendamentos operacionais para {dayStr}.</Text>
          </View>
        ) : (
          <View style={styles.dayTimelineContainer}>
            {/* Hour Row segments */}
            {workingHours.map((hour, idx) => {
              // Match services checking exact hours
              const srvsThisHour = matchedSvs.filter(s => {
                const sHour = s.metadata?.schedule?.time?.split(':')[0];
                const matchingHour = hour?.split(':')[0];
                return sHour === matchingHour;
              });

              return (
                <View key={idx} style={[styles.timelineRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.timelineHourCol}>
                    <Text style={[styles.timelineHourText, { color: colors.textSecondary }]}>{hour}</Text>
                  </View>
                  
                  <View style={styles.timelineContentCol}>
                    {srvsThisHour.map(s => {
                      const hasHourConflict = checkServiceConflict(dayStr, s.metadata?.schedule?.time, s.technician_id, s.id);
                      return (
                        <Pressable
                          key={s.id}
                          onPress={() => handleOpenReschedule(s)}
                          style={[
                            styles.timelineCard,
                            { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: getStatusColor(s.status) },
                            hasHourConflict && styles.timelineCardConflict
                          ]}
                        >
                          {hasHourConflict && (
                            <View style={styles.conflictBanner}>
                              <Feather name="alert-triangle" size={12} color="#E53E3E" style={{ marginRight: 4 }} />
                              <Text style={styles.conflictBannerText}>⚠️ CONFLITO DE HORÁRIO DETECTADO NESTE TÉCNICO</Text>
                            </View>
                          )}
                          
                          <View style={styles.timelineCardMeta}>
                            <View style={[styles.typeBadge, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6', borderColor: colors.border }]}>
                              <Text style={[styles.typeBadgeText, { color: colors.textMuted }]}>{s.tipo}</Text>
                            </View>
                            <Text style={[styles.timelineCardTimeBadge, { color: colors.primary }]}>
                              ⏰ {s.metadata?.schedule?.time} ({s.metadata?.schedule?.duration || '1h30'}m)
                            </Text>
                          </View>

                          <Text style={[styles.timelineCardCliente, { color: colors.text }]}>{s.cliente}</Text>
                          <Text style={[styles.timelineCardVehicle, { color: colors.textSecondary }]}>{s.veiculo} • Placa {s.placa}</Text>
                          <Text style={[styles.timelineCardAddress, { color: colors.textMuted }]}>📍 {s.endereco}</Text>

                          <View style={[styles.timelineCardFooter, { borderTopColor: colors.border }]}>
                            <View style={styles.timelineTechRow}>
                              <View style={[styles.techDotAvatar, { backgroundColor: colors.primarySoft, borderColor: 'rgba(230,0,80,0.15)' }]}>
                                <Text style={[styles.techAvatarText, { color: colors.primary }]}>
                                  {s.users?.nome?.substr(0, 2).toUpperCase() || 'UN'}
                                </Text>
                              </View>
                              <Text style={[styles.timelineTechName, { color: colors.textMuted }]}>
                                Responsável: <Text style={{ color: colors.text }}>{s.users?.nome || 'Nenhum'}</Text>
                              </Text>
                            </View>

                            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(s.status) + '22', borderWidth: 1, borderColor: getStatusColor(s.status) }]}>
                              <Text style={[styles.statusIndicatorText, { color: getStatusColor(s.status) }]}>
                                {s.status?.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // Check unique active conflicts calculation for upper warning header banner
  const countActiveConflicts = () => {
    let count = 0;
    services.forEach(s => {
      const sDate = s.metadata?.schedule?.date;
      const sTime = s.metadata?.schedule?.time;
      if (checkServiceConflict(sDate, sTime, s.technician_id, s.id)) {
        count++;
      }
    });
    return Math.floor(count / 2); // Divide by 2 since each conflict is logged in both matching conflicting slots
  };

  const activeConflicts = countActiveConflicts();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Upper Calendar Filter and View Headers */}
      <View style={[styles.headerPanel, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={[styles.headerMainTitle, { color: colors.text }]}>Agenda Operacional</Text>
            <Text style={styles.headerSubtitle}>Centralização do calendário dos técnicos e alocações SaaS</Text>
          </View>

          {/* View Toggles */}
          <View style={[styles.viewToggleGroup, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.03)' : '#E5E7EB', borderColor: colors.border }]}>
            {['month', 'week', 'day'].map(view => (
              <Pressable
                key={view}
                onPress={() => setViewType(view)}
                style={[styles.viewToggleBtn, viewType === view && { backgroundColor: colors.primary }]}
                id={`calendar-view-${view}`}
              >
                <Text style={[styles.viewToggleText, { color: colors.textMuted }, viewType === view && { color: '#FFFFFF' }]}>
                  {view === 'month' ? 'Mês' : view === 'week' ? 'Semana' : 'Dia'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Global Warnings for scheduling overlaps */}
        {activeConflicts > 0 && (
          <View style={styles.globalWarningBanner}>
            <Feather name="alert-triangle" size={16} color="#FFE082" style={{ marginRight: 8 }} />
            <Text style={styles.globalWarningText}>
              Atenção: Detectamos <Text style={{ fontWeight: 'bold' }}>{activeConflicts} conflitos de agenda</Text> (mesmo técnico alocado simultaneamente). Clique em uma OS para reagendar.
            </Text>
          </View>
        )}

        {/* Filters and Controls */}
        <View style={styles.controlsRow}>
          {/* Navigation Month/Week */}
          <View style={styles.navDateControls}>
            <Pressable onPress={handlePrev} style={[styles.navCircleBtn, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.04)' : '#E5E7EB', borderColor: colors.border }]}>
              <Feather name="chevron-left" size={18} color={colors.text} />
            </Pressable>
            
            <Text style={[styles.currentDateLabel, { color: colors.text }]}>
              {viewType === 'month' && `${MONTHS[currentDate.getMonth()]} de ${currentDate.getFullYear()}`}
              {viewType === 'week' && `Semana de ${currentDate.getDate()} / ${MONTHS[currentDate.getMonth()]}`}
              {viewType === 'day' && currentDate.toLocaleDateString('pt-BR')}
            </Text>

            <Pressable onPress={handleNext} style={[styles.navCircleBtn, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.04)' : '#E5E7EB', borderColor: colors.border }]}>
              <Feather name="chevron-right" size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* Quick Filter Sections */}
          <View style={styles.filtersWrapper}>
            {/* Tech filter dropdown-like rows */}
            <View style={styles.filterChipContainer}>
              <Text style={styles.filterChipPreLabel}>Técnico:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.techChipsScroll}>
                <Pressable
                  onPress={() => setSelectedTech('all')}
                  style={[styles.filterChip, { borderColor: colors.border }, selectedTech === 'all' && { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
                >
                  <Text style={[styles.filterChipText, { color: colors.textMuted }, selectedTech === 'all' && { color: colors.primary, fontWeight: '700' }]}>
                    Todos
                  </Text>
                </Pressable>
                {technicians.map(t => (
                  <Pressable
                    key={t.id}
                    onPress={() => setSelectedTech(t.id)}
                    style={[styles.filterChip, { borderColor: colors.border }, selectedTech === t.id && { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
                  >
                    <Text style={[styles.filterChipText, { color: colors.textMuted }, selectedTech === t.id && { color: colors.primary, fontWeight: '700' }]}>
                      {t.nome.split(' ')[0]}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Status Filter */}
            <View style={styles.statusFilters}>
              <Pressable
                onPress={() => setSelectedStatus(selectedStatus === 'all' ? 'pendente' : selectedStatus === 'pendente' ? 'em_andamento' : selectedStatus === 'em_andamento' ? 'concluido' : 'all')}
                style={[styles.statusCycleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Feather name="filter" size={12} color={colors.text} style={{ marginRight: 6 }} id="feather-filter-icon" />
                <Text style={[styles.statusCycleBtnText, { color: colors.text }]}>
                  Status: {selectedStatus === 'all' ? 'Todos' : selectedStatus === 'pendente' ? 'Pendente' : selectedStatus === 'em_andamento' ? 'Em andamento' : 'Concluído'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Main Viewport panel */}
      {loading ? (
        <View style={styles.loaderArea}>
          <ActivityIndicator size="large" color="#635BFF" />
          <Text style={styles.loadingText}>Sincronizando banco de dados operacionais em tempo real...</Text>
        </View>
      ) : (
        <ScrollView style={styles.viewBodyArea} contentContainerStyle={{ paddingBottom: spacing['2xl'] }}>
          {viewType === 'month' && renderMonthView()}
          {viewType === 'week' && renderWeekView()}
          {viewType === 'day' && renderDayView()}
        </ScrollView>
      )}

      {/* MODAL: RESCHEDULE CONTROLLER (REALLOCATION PANEL) */}
      <Modal
        visible={rescheduleModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.surfaceElevated, borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Reagendar Ordem de Serviço</Text>
                <Text style={styles.modalSubtitle}>ID: {selectedService?.id?.substring(0, 8)}...</Text>
              </View>
              <Pressable onPress={() => setRescheduleModalVisible(false)} style={[styles.modalCloseBtn, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.03)' : '#E5E7EB' }]}>
                <Feather name="x" size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            {selectedService && (
              <View style={styles.modalForm}>
                {/* Visual conflict indicator computed directly within active changes */}
                {checkServiceConflict(newDate, newTime, newTech, selectedService.id) && (
                  <View style={styles.modalFormConflictBanner}>
                    <Feather name="alert-triangle" size={14} color="#ECC94B" style={{ marginRight: 6 }} />
                    <Text style={styles.modalFormConflictText}>
                      Atenção: O técnico selecionado já possui um serviço agendado para as {newTime} do dia {newDate}.
                    </Text>
                  </View>
                )}

                <View style={[styles.infoRowBlock, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, marginBottom: 12 }]}>
                  <Text style={styles.infoLabel}>Cliente</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{selectedService.cliente}</Text>
                </View>

                {/* Datepicker mock inputs */}
                <View style={styles.formSplitRow}>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Data de Atendimento</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      value={newDate}
                      onChangeText={setNewDate}
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor="#4A5568"
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Horário</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      value={newTime}
                      onChangeText={setNewTime}
                      placeholder="HH:MM"
                      placeholderTextColor="#4A5568"
                    />
                  </View>
                </View>

                {/* Technician Re-assignment Selection */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Atribuir Técnico Técnico</Text>
                  <View style={styles.techGridSelection}>
                    <Pressable
                      style={[styles.techSelectionItem, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.02)' : '#F5F5F7', borderColor: colors.border }, !newTech && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
                      onPress={() => setNewTech('')}
                    >
                      <Text style={[styles.techSelectionItemText, { color: colors.textSecondary }, !newTech && { color: colors.primary, fontWeight: '700' }]}>
                        Nenhum Técnico (Aguardando Alocação)
                      </Text>
                    </Pressable>
                    {technicians.map(t => (
                      <Pressable
                        key={t.id}
                        style={[styles.techSelectionItem, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.02)' : '#F5F5F7', borderColor: colors.border }, newTech === t.id && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
                        onPress={() => setNewTech(t.id)}
                      >
                        <Text style={[styles.techSelectionItemText, { color: colors.textSecondary }, newTech === t.id && { color: colors.primary, fontWeight: '700' }]}>
                          {t.nome} (Ativo)
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Footer Buttons control */}
                <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                  <Pressable
                    onPress={() => setRescheduleModalVisible(false)}
                    style={[styles.cancelBtn, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.02)' : '#F3F4F6', borderColor: colors.border }]}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancelar</Text>
                  </Pressable>

                  <Pressable
                    disabled={savingAction}
                    onPress={handleSaveReschedule}
                    style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  >
                    {savingAction ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.saveBtnText, { color: '#FFFFFF' }]}>Confirmar Alteração</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerPanel: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  headerMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ECEFF4',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  viewToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: radii.sm,
  },
  viewToggleBtnActive: {
    backgroundColor: '#635BFF',
  },
  viewToggleText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
  },
  viewToggleTextActive: {
    color: '#ECEFF4',
  },
  globalWarningBanner: {
    backgroundColor: 'rgba(214, 158, 46, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(214, 158, 46, 0.2)',
    borderRadius: radii.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  globalWarningText: {
    color: '#FFE082',
    fontSize: 12,
    flex: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    flexWrap: 'wrap',
    gap: 16,
  },
  navDateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  currentDateLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ECEFF4',
    minWidth: 140,
    textAlign: 'center',
  },
  filtersWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  filterChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChipPreLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  techChipsScroll: {
    maxWidth: 240,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.full,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#635BFF22',
    borderColor: '#635BFF',
  },
  filterChipText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#635BFF',
    fontWeight: '700',
  },
  statusFilters: {
    flexDirection: 'row',
  },
  statusCycleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.md,
  },
  statusCycleBtnText: {
    fontSize: 11,
    color: '#ECEFF4',
    fontWeight: '600',
  },
  loaderArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 100,
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  viewBodyArea: {
    flex: 1,
    padding: spacing.lg,
  },
  gridContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.lg,
    backgroundColor: '#12131C',
    overflow: 'hidden',
  },
  gridHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#171926',
  },
  gridHeaderCell: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  gridHeaderCellText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gridBody: {
    flexDirection: 'column',
  },
  gridWeekRow: {
    flexDirection: 'row',
    height: 154,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  gridDayCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.04)',
    padding: 6,
    position: 'relative',
  },
  gridDayCellEmpty: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  gridDayCellToday: {
    backgroundColor: '#635BFF06',
  },
  gridDayNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  gridDayNumberToday: {
    color: '#635BFF',
    backgroundColor: '#635BFF1c',
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  gridDayContentScroll: {
    flex: 1,
  },
  compactAppointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
    paddingHorizontal: 2,
    gap: 4.5,
    width: '100%',
    marginBottom: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactAppointmentTime: {
    fontSize: 9.5,
    fontWeight: '700',
    minWidth: 26,
  },
  compactAppointmentText: {
    fontSize: 9,
    fontWeight: '500',
    flex: 1,
  },
  weekContainer: {
    flex: 1,
    backgroundColor: '#12131C',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#171926',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  weekHeadCell: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.04)',
  },
  weekHeadCellToday: {
    backgroundColor: '#635BFF08',
  },
  weekHeadDayName: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
  },
  weekHeadDayNum: {
    fontSize: 14,
    color: '#ECEFF4',
    fontWeight: '800',
    marginTop: 2,
  },
  weekHeadDayNumToday: {
    color: '#635BFF',
  },
  weekBodyRow: {
    flexDirection: 'row',
    minHeight: 380,
  },
  weekColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.04)',
  },
  weekColScroll: {
    padding: 6,
    gap: 8,
  },
  noWeekItemsText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.15)',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  weekServiceCard: {
    padding: 8,
    backgroundColor: '#171926',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.md,
    borderLeftWidth: 3,
  },
  weekCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekCardTime: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ECEFF4',
  },
  conflictHeaderBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: 'rgba(229, 62, 62, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.3)',
    borderRadius: radii.sm,
  },
  conflictHeaderBadgeText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#E53E3E',
  },
  weekCardClient: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ECEFF4',
    marginTop: 4,
  },
  weekCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  weekCardTech: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
  },
  weekCardVehicle: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.25)',
    marginTop: 2,
  },
  dayViewOuter: {
    backgroundColor: '#12131C',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: spacing.lg,
  },
  emptyDayContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    justifyContent: 'center',
  },
  emptyDayTitle: {
    color: '#ECEFF4',
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  emptyDaySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  dayTimelineContainer: {
    flexDirection: 'column',
  },
  timelineRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 12,
  },
  timelineHourCol: {
    width: 60,
    paddingTop: 4,
  },
  timelineHourText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
  },
  timelineContentCol: {
    flex: 1,
    gap: 8,
  },
  timelineCard: {
    backgroundColor: '#171926',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
  },
  timelineCardConflict: {
    borderColor: '#E53E3E44',
    backgroundColor: 'rgba(229, 62, 62, 0.02)',
  },
  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 62, 62, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.15)',
    borderRadius: radii.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: spacing.xs,
  },
  conflictBannerText: {
    color: '#E53E3E',
    fontSize: 9,
    fontWeight: '800',
  },
  timelineCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  typeBadgeText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
  },
  timelineCardTimeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#635BFF',
  },
  timelineCardCliente: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ECEFF4',
  },
  timelineCardVehicle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  timelineCardAddress: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  timelineCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: spacing.xs,
  },
  timelineTechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  techDotAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#635BFF22',
    borderWidth: 1,
    borderColor: '#635BFF55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  techAvatarText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#635BFF',
  },
  timelineTechName: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  statusIndicator: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
  },
  statusIndicatorText: {
    fontSize: 9,
    fontWeight: '800',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#12131C',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#171926',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ECEFF4',
  },
  modalSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalForm: {
    padding: spacing.lg,
  },
  modalFormConflictBanner: {
    backgroundColor: 'rgba(214, 158, 46, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(214, 158, 46, 0.15)',
    borderRadius: radii.md,
    padding: 10,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalFormConflictText: {
    fontSize: 11,
    color: '#FFE082',
    flex: 1,
  },
  infoRowBlock: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  infoLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ECEFF4',
    marginTop: 3,
  },
  formSplitRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: 12,
  },
  formField: {
    flex: 1,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#171926',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.md,
    padding: 10,
    color: '#ECEFF4',
    fontSize: 13,
  },
  techGridSelection: {
    flexDirection: 'column',
    gap: 6,
  },
  techSelectionItem: {
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: radii.md,
  },
  techSelectionItemActive: {
    borderColor: '#635BFF',
    backgroundColor: '#635BFF11',
  },
  techSelectionItemText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  techSelectionItemTextActive: {
    color: '#635BFF',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: spacing.lg,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    backgroundColor: '#635BFF',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ECEFF4',
  },
});
