import { auth, db } from './firebase';
export { auth, db };
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signUp: async () => ({ data: null, error: null }),
    signInWithPassword: async () => ({ data: null, error: null }),
    updateUser: async () => ({ data: null, error: null }),
    signInWithOAuth: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    insert: async () => ({ data: null, error: null }),
    select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
    delete: () => ({ eq: () => ({ eq: () => ({ error: null }) }) }),
    upsert: async () => ({ error: null }),
  }),
  rpc: async () => ({ data: null, error: null }),
  removeChannel: () => {},
  channel: () => ({
    on: () => ({
      subscribe: () => ({})
    }),
    subscribe: () => ({})
  }),
};

export default supabase;
