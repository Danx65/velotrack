import { supabase } from '../lib/supabase';
import { historyService } from './history';
import { clearQueryCache } from '../hooks/useQuery';
import { decode } from 'base64-arraybuffer';

const PAGE_SIZE = 20;

export function parseMetadata(dbRow) {
  if (!dbRow) return null;
  let meta = dbRow.metadata;

  if (!meta || Object.keys(meta).length === 0) {
    if (dbRow.checklist && !Array.isArray(dbRow.checklist)) {
      const c = dbRow.checklist;
      meta = {
        schedule: {
          date: c.date || (dbRow.created_at ? new Date(dbRow.created_at).toLocaleDateString('pt-BR') : ''),
          time: c.time || '14:00',
          duration: c.duration || '01:30',
          repType: c.repType || 'Não se repete',
          repDays: c.repDays || [],
        },
        location: {
          endereco: dbRow.endereco || c.endereco || '',
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
        location: { endereco: dbRow.endereco || '', cidade: '', googleMapsUrl: '', latitude: '-23.55052', longitude: '-46.63330' },
        billing: { valServico: '0,00', formaPagamento: 'Pix', isFaturado: true, isPago: false },
        notifications: { satisfactionSurvey: true, whatsappOS: true, notifAgendamento: true, notifConclusao: true, notifPush: true, externalCode: '', keyword: '' },
        attachments: [],
        equipment: [],
      };
    }
  }
  return meta;
}

export const servicosService = {
  list: async ({ page = 0, search = '', dateFilter = 'todas', technicianId = null, status = null } = {}) => {
    let query = supabase
      .from('servicos')
      .select('*, users(nome)', { count: 'exact' });

    if (technicianId) {
      query = query.eq('technician_id', technicianId);
    }

    if (status) {
      if (Array.isArray(status)) {
        query = query.in('status', status);
      } else {
        query = query.eq('status', status);
      }
    }

    if (search.trim()) {
      const q = search.trim();
      query = query.or(`cliente.ilike.%${q}%,placa.ilike.%${q}%,veiculo.ilike.%${q}%,endereco.ilike.%${q}%`);
    }

    if (dateFilter !== 'todas') {
      const now = new Date();
      let startDate;
      let endDate;
      switch (dateFilter) {
        case 'hoje':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'ontem':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'mes':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
      }
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lt('created_at', endDate.toISOString());
      }
    }

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const formattedData = (data || []).map(item => ({
      ...item,
      metadata: parseMetadata(item)
    }));

    return { data: formattedData, count: count || 0, hasMore: (count || 0) > to + 1 };
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('servicos')
      .select('*, users(nome)')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (data) {
      data.metadata = parseMetadata(data);
    }
    return data;
  },

  create: async (payload) => {
    const metaObj = payload.metadata || (payload.checklist && !Array.isArray(payload.checklist) ? {
      schedule: {
        date: payload.checklist.date || '',
        time: payload.checklist.time || '14:00',
        duration: payload.checklist.duration || '01:30',
        repType: payload.checklist.repType || 'Não se repete',
        repDays: payload.checklist.repDays || []
      },
      location: {
        endereco: payload.endereco || payload.checklist.endereco || '',
        cidade: payload.checklist.cidade || '',
        googleMapsUrl: payload.checklist.googleMapsUrl || '',
        latitude: payload.checklist.latitude || '-23.55052',
        longitude: payload.checklist.longitude || '-46.63330'
      },
      billing: {
        valServico: payload.checklist.valServico || '0,00',
        formaPagamento: payload.checklist.formaPagamento || 'Pix',
        isFaturado: payload.checklist.isFaturado ?? true,
        isPago: payload.checklist.isPago ?? false
      },
      notifications: {
        satisfactionSurvey: payload.checklist.satisfactionSurvey ?? true,
        whatsappOS: payload.checklist.whatsappOS ?? true,
        notifAgendamento: payload.checklist.notifAgendamento ?? true,
        notifConclusao: payload.checklist.notifConclusao ?? true,
        notifPush: payload.checklist.notifPush ?? true,
        externalCode: payload.checklist.externalCode || '',
        keyword: payload.checklist.keyword || ''
      },
      attachments: payload.checklist.attachments || [],
      equipment: payload.checklist.equipments || payload.checklist.equipment || []
    } : {
      schedule: { date: '', time: '14:00', duration: '01:30', repType: 'Não se repete', repDays: [] },
      location: { endereco: payload.endereco || '', cidade: '', googleMapsUrl: '', latitude: '-23.55052', longitude: '-46.63330' },
      billing: { valServico: '0,00', formaPagamento: 'Pix', isFaturado: true, isPago: false },
      notifications: { satisfactionSurvey: true, whatsappOS: true, notifAgendamento: true, notifConclusao: true, notifPush: true, externalCode: '', keyword: '' },
      attachments: [],
      equipment: []
    });

    const checkObj = (payload.checklist && Array.isArray(payload.checklist)) ? payload.checklist : [];

    // Filter properties to only valid columns in the public.servicos table
    const insertPayload = {};
    const validColumns = [
      'cliente',
      'endereco',
      'veiculo',
      'placa',
      'telefone',
      'tipo',
      'descricao',
      'status',
      'priority',
      'technician_id',
      'checklist',
      'observations',
      'fotos',
      'tempo_inicio',
      'tempo_fim',
      'metadata',
      'is_test'
    ];

    validColumns.forEach(col => {
      if (payload[col] !== undefined) {
        insertPayload[col] = payload[col];
      }
    });

    insertPayload.metadata = metaObj;
    insertPayload.checklist = checkObj;
    insertPayload.is_test = payload.is_test ?? false;

    // Handle empty string for technician_id gracefully to avoid uuid parse issues
    if (insertPayload.technician_id === '') {
      insertPayload.technician_id = null;
    }

    let result;
    try {
      const { data, error } = await supabase
        .from('servicos')
        .insert({ ...insertPayload, status: 'pendente' })
        .select('id')
        .single();
      if (error) throw error;
      result = data;
    } catch (dbErr) {
      console.warn("First insert attempt failed, retrying inside legacy safety path:", dbErr);
      if (metaObj) {
        const oldChecklistPayload = {
          ...metaObj.schedule,
          ...metaObj.location,
          ...metaObj.billing,
          ...metaObj.notifications,
          attachments: metaObj.attachments,
          equipments: metaObj.equipment
        };
        const fallbackPayload = {};
        validColumns.forEach(col => {
          if (payload[col] !== undefined) {
            fallbackPayload[col] = payload[col];
          }
        });
        fallbackPayload.checklist = oldChecklistPayload;
        delete fallbackPayload.metadata;

        if (fallbackPayload.technician_id === '') {
          fallbackPayload.technician_id = null;
        }

        const { data, error } = await supabase
          .from('servicos')
          .insert({ ...fallbackPayload, status: 'pendente' })
          .select('id')
          .single();
        if (error) throw error;
        result = data;
      } else {
        throw dbErr;
      }
    }

    if (result?.id) {
      let userId = payload.user_id || payload.created_by || null;
      if (!userId) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          userId = session?.user?.id || null;
        } catch {}
      }

      try {
        await historyService.log(result.id, userId,
          historyService.ACTIONS.CREATED,
          `OS criada para ${payload.cliente} - ${payload.veiculo}`
        );
        if (payload.technician_id) {
          await historyService.log(result.id, userId,
            historyService.ACTIONS.TECHNICIAN_ASSIGNED,
            `Técnico atribuído`
          );
        }
      } catch (logErr) {
        console.warn("Could not record creation history:", logErr);
      }
    }
    clearQueryCache();
    return result;
  },

  update: async (id, payload) => {
    // Fetch old record safely for logging without crashing the whole update
    let old = null;
    try {
      const { data } = await supabase
        .from('servicos')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (data) {
        data.metadata = parseMetadata(data);
        old = data;
      }
    } catch (e) {
      console.warn("Could not fetch old record for history logs:", e);
    }

    const metaObj = payload.metadata || (payload.checklist && !Array.isArray(payload.checklist) ? {
      schedule: {
        date: payload.checklist.date || '',
        time: payload.checklist.time || '14:00',
        duration: payload.checklist.duration || '01:30',
        repType: payload.checklist.repType || 'Não se repete',
        repDays: payload.checklist.repDays || []
      },
      location: {
        endereco: payload.endereco || payload.checklist.endereco || '',
        cidade: payload.checklist.cidade || '',
        googleMapsUrl: payload.checklist.googleMapsUrl || '',
        latitude: payload.checklist.latitude || '-23.55052',
        longitude: payload.checklist.longitude || '-46.63330'
      },
      billing: {
        valServico: payload.checklist.valServico || '0,00',
        formaPagamento: payload.checklist.formaPagamento || 'Pix',
        isFaturado: payload.checklist.isFaturado ?? true,
        isPago: payload.checklist.isPago ?? false
      },
      notifications: {
        satisfactionSurvey: payload.checklist.satisfactionSurvey ?? true,
        whatsappOS: payload.checklist.whatsappOS ?? true,
        notifAgendamento: payload.checklist.notifAgendamento ?? true,
        notifConclusao: payload.checklist.notifConclusao ?? true,
        notifPush: payload.checklist.notifPush ?? true,
        externalCode: payload.checklist.externalCode || '',
        keyword: payload.checklist.keyword || ''
      },
      attachments: payload.checklist.attachments || [],
      equipment: payload.checklist.equipments || payload.checklist.equipment || []
    } : null);

    // Filter properties to only valid columns in the public.servicos table
    const updatePayload = {};
    const validColumns = [
      'cliente',
      'endereco',
      'veiculo',
      'placa',
      'telefone',
      'tipo',
      'descricao',
      'status',
      'priority',
      'technician_id',
      'checklist',
      'observations',
      'fotos',
      'tempo_inicio',
      'tempo_fim',
      'metadata',
      'is_test'
    ];

    validColumns.forEach(col => {
      if (payload[col] !== undefined) {
        updatePayload[col] = payload[col];
      }
    });

    if (metaObj) {
      updatePayload.metadata = metaObj;
      if (!Array.isArray(payload.checklist)) {
        delete updatePayload.checklist;
      }
    }

    if (updatePayload.technician_id === '') {
      updatePayload.technician_id = null;
    }

    try {
      const { error } = await supabase
        .from('servicos')
        .update(updatePayload)
        .eq('id', id);
      if (error) throw error;
    } catch (dbErr) {
      console.warn("First update attempt failed, retrying inside legacy safety path:", dbErr);
      if (metaObj) {
        const oldChecklistPayload = {
          ...metaObj.schedule,
          ...metaObj.location,
          ...metaObj.billing,
          ...metaObj.notifications,
          attachments: metaObj.attachments,
          equipments: metaObj.equipment
        };
        const fallbackPayload = {};
        validColumns.forEach(col => {
          if (payload[col] !== undefined) {
            fallbackPayload[col] = payload[col];
          }
        });
        fallbackPayload.checklist = oldChecklistPayload;
        delete fallbackPayload.metadata;

        if (fallbackPayload.technician_id === '') {
          fallbackPayload.technician_id = null;
        }

        const { error } = await supabase
          .from('servicos')
          .update(fallbackPayload)
          .eq('id', id);
        if (error) throw error;
      } else {
        throw dbErr;
      }
    }

    let userId = payload.user_id || payload.updated_by || null;
    if (!userId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      } catch {}
    }

    try {
      if (old) {
        // Log de Status
        if (payload.status && payload.status !== old.status) {
          await historyService.log(id, userId,
            historyService.ACTIONS.STATUS_CHANGED,
            `Status alterado de "${old.status}" para "${payload.status}"`
          );
        }
        
        // Log de Técnico Alocado
        if (payload.technician_id !== undefined && payload.technician_id !== old.technician_id) {
          let oldTechName = 'Não atribuído';
          let newTechName = 'Não atribuído';
          try {
            if (old.technician_id) {
              const { data: ot } = await supabase.from('users').select('nome').eq('id', old.technician_id).maybeSingle();
              if (ot) oldTechName = ot.nome;
            }
            if (payload.technician_id) {
              const { data: nt } = await supabase.from('users').select('nome').eq('id', payload.technician_id).maybeSingle();
              if (nt) newTechName = nt.nome;
            }
          } catch {}
          await historyService.log(id, userId,
            historyService.ACTIONS.TECHNICIAN_CHANGED,
            `Técnico alterado de "${oldTechName}" para "${newTechName}"`
          );
        }

        // Log de Alteração de Prioridade
        if (payload.priority && payload.priority !== old.priority) {
          await historyService.log(id, userId,
            historyService.ACTIONS.PRIORITY_CHANGED,
            `Prioridade alterada de "${old.priority}" para "${payload.priority}"`
          );
        }

        // Log de Faturamento de Valor
        const oldVal = old.metadata?.billing?.valServico || '0,00';
        const newVal = metaObj?.billing?.valServico || '0,00';
        if (oldVal !== newVal) {
          await historyService.log(id, userId,
            'valor_changed',
            `Valor alterado de R$ ${oldVal} para R$ ${newVal}`
          );
        }
      }

      await historyService.log(id, userId,
        historyService.ACTIONS.EDITED,
        'OS atualizada'
      );
    } catch (logErr) {
      console.warn("Could not record update history:", logErr);
    }
    clearQueryCache();
  },

  startService: async (id) => {
    const { error } = await supabase
      .from('servicos')
      .update({ status: 'em_andamento', tempo_inicio: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;

    try {
      let userId = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      } catch {}
      await historyService.log(id, userId, historyService.ACTIONS.STARTED, 'Serviço iniciado');
    } catch (e) {
      console.warn("Could not log startService in history:", e);
    }
    clearQueryCache();
  },

  finishService: async (id, data) => {
    const { error } = await supabase
      .from('servicos')
      .update({
        status: 'concluido',
        tempo_fim: new Date().toISOString(),
        ...data,
      })
      .eq('id', id);
    if (error) throw error;

    try {
      let userId = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      } catch {}
      await historyService.log(id, userId, historyService.ACTIONS.FINISHED, 'Serviço finalizado com sucesso');
    } catch (e) {
      console.warn("Could not log finishService in history:", e);
    }
    clearQueryCache();
  },

  updateChecklist: async (id, checklist) => {
    const { error } = await supabase
      .from('servicos')
      .update({ checklist })
      .eq('id', id);
    if (error) throw error;
    clearQueryCache();
  },

  updateObservations: async (id, observations) => {
    const { error } = await supabase
      .from('servicos')
      .update({ observations })
      .eq('id', id);
    if (error) throw error;
    clearQueryCache();
  },

  addPhoto: async (id, fotos) => {
    const { error } = await supabase
      .from('servicos')
      .update({ fotos })
      .eq('id', id);
    if (error) throw error;
    clearQueryCache();
  },
};

export const photoService = {
  upload: async (file) => {
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
    const { error } = await supabase.storage
      .from('fotos')
      .upload(fileName, file, { contentType: 'image/jpeg' });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(fileName);
    return urlData.publicUrl;
  },

  uploadBase64: async (base64) => {
    const fileName = `${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('fotos')
      .upload(fileName, decode(base64), { contentType: 'image/jpeg' });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(fileName);
    return urlData.publicUrl;
  },
};
