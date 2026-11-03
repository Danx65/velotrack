import { supabase } from '../lib/supabase';

export const suporteService = {
  listAll: async () => {
    try {
      const { data, error } = await supabase
        .from('mensagens_de_suporte')
        .select('*, users(nome)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        console.error('Error in suporteService.listAll with relation: ', error);
        // Fallback without user join
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('mensagens_de_suporte')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      }
      return data || [];
    } catch (e) {
      console.error('Catch-all error in suporteService.listAll: ', e);
      return [];
    }
  },

  listByUser: async (userId) => {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('mensagens_de_suporte')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error in suporteService.listByUser: ', e);
      return [];
    }
  },

  send: async (userId, message) => {
    if (!userId || !message) return;
    const { error } = await supabase
      .from('mensagens_de_suporte')
      .insert({ user_id: userId, mensagem: message.trim() });
    if (error) throw error;
  },
};
