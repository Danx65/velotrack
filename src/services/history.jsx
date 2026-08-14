import { supabase } from '../lib/supabase';

const ACTIONS = {
  CREATED: 'created',
  TECHNICIAN_ASSIGNED: 'technician_assigned',
  TECHNICIAN_CHANGED: 'technician_changed',
  STATUS_CHANGED: 'status_changed',
  STARTED: 'started',
  FINISHED: 'finished',
  CHECKLIST_UPDATED: 'checklist_updated',
  OBSERVATION_ADDED: 'observation_added',
  PHOTO_ADDED: 'photo_added',
  PRIORITY_CHANGED: 'priority_changed',
  EDITED: 'edited',
};

export const historyService = {
  ACTIONS,

  log: async (serviceId, userId, action, description = '') => {
    const { error } = await supabase
      .from('service_history')
      .insert({
        service_id: serviceId,
        user_id: userId,
        action,
        description,
      });
    if (error) console.error('Erro ao registrar histórico:', error);
  },

  getByService: async (serviceId) => {
    const { data, error } = await supabase
      .from('service_history')
      .select('*, users(nome)')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  getRecentByTech: async (technicianId, limit = 10) => {
    const { data, error } = await supabase
      .from('service_history')
      .select('*, users(nome), servicos!inner(cliente, veiculo, placa)')
      .eq('servicos.technician_id', technicianId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  getRecentAll: async (limit = 20) => {
    const { data, error } = await supabase
      .from('service_history')
      .select('*, users(nome), servicos!inner(cliente, veiculo, placa)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
};
