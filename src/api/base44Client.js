/**
 * ============================================================
 * base44Client.js  (WRAPPER DE COMPATIBILITATE)
 * ============================================================
 *
 * Acest fișier înlocuiește complet SDK-ul Base44.
 *
 * Scop:
 * - Păstrăm interfața `base44` folosită deja în UI
 * - Implementarea reală este făcută cu Supabase
 * - UI-ul NU trebuie modificat
 *
 * Practic:
 * - „base44” devine un adaptor peste Supabase
 * - dacă mâine schimbăm backendul, UI-ul rămâne la fel
 *
 * ============================================================
 */


/**
 * ------------------------------------------------------------
 * Inițializare Supabase client
 * ------------------------------------------------------------
 *
 * Cheile sunt citite din .env:
 *  - VITE_SUPABASE_URL
 *  - VITE_SUPABASE_ANON_KEY
 *
 * Folosim DOAR anon key (sigur pentru frontend).
 */
import { supabase } from '@/lib/supabaseClient';

/**
 * ============================================================
 * Obiectul `base44`
 * ============================================================
 *
 * Acesta imită structura SDK-ului Base44:
 *  - base44.auth
 *  - base44.entities
 *  - base44.functions
 *
 * UI-ul importă `base44` și nu știe ce backend există dedesubt.
 */
export const base44 = {

  /**
   * ----------------------------------------------------------
   * AUTH — autentificare și sesiune
   * ----------------------------------------------------------
   */
  auth: {

    /**
     * Verifică dacă există o sesiune activă
     * Returnează true / false
     */
    async isAuthenticated() {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    },

    /**
     * Returnează userul autentificat curent
     * (din Supabase Auth)
     */
    async me() {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },

    /**
     * Redirecționează către pagina de login
     * (nu mai există login extern ca la Base44)
     */
    redirectToLogin() {
      window.location.href = '/login';
    },

    /**
     * Logout complet:
     * - șterge sesiunea Supabase
     * - trimite userul la login
     */
    async logout() {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  },

  /**
   * ----------------------------------------------------------
   * ENTITIES — acces la date (DB)
   * ----------------------------------------------------------
   *
   * În Base44 acestea erau „entities”.
   * Aici sunt tabele Supabase.
   */
  entities: {

    /**
     * Conversații
     */
    conversations: {

      /**
       * Returnează toate conversațiile userului
       */
      async getAll() {
        return supabase
          .from('conversations')
          .select('*')
          .order('created_at', { ascending: false });
      },

      /**
       * Creează o conversație nouă
       */
      async create() {
        return supabase
          .from('conversations')
          .insert({})
          .select()
          .single();
      }
    },

    /**
     * Mesaje din conversații
     */
    messages: {

      /**
       * Ia toate mesajele dintr-o conversație
       */
      async getByConversation(conversationId) {
        return supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
      },

      /**
       * Inserează un mesaj nou
       * (user sau assistant)
       */
      async insert(message) {
        return supabase
          .from('messages')
          .insert(message)
          .select()
          .single();
      }
    },

    /**
     * Profilul userului (extensie peste auth.users)
     */
    profiles: {

      /**
       * Returnează profilul userului logat
       */
      async me() {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return null;

        return supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
      }
    }
  },

  /**
   * ----------------------------------------------------------
   * FUNCTIONS — logică specială (Stripe, credits, etc.)
   * ----------------------------------------------------------
   *
   * În Base44 acestea erau Cloud Functions.
   * Aici vor deveni Supabase Edge Functions.
   *
   * Deocamdată sunt placeholder.
   */
  functions: {

    /**
     * Pornire checkout Stripe
     */
    async createCheckout(payload) {
      console.warn('createCheckout not implemented yet', payload);
    },

    /**
     * Adăugare credits user
     */
    async addMessagesToUser(payload) {
      console.warn('addMessagesToUser not implemented yet', payload);
    }
  }
};
