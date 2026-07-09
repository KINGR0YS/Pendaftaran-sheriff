import { supabase } from './supabase';

export async function logActivity(action: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const user = session.user;
    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'Unknown';
    const role = user.user_metadata?.role || 'dismag';
    
    const { error } = await supabase.from('activity_logs').insert({
      username,
      role,
      action
    });
    
    if (error) {
      console.warn('Failed to log activity to database, falling back to localStorage:', error.message);
      // Fallback to localStorage for backward compatibility / local testing
      const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
      logs.unshift({ 
        time: new Date().toISOString(), 
        text: `<strong>${username}</strong> (${role.toUpperCase()}): ${action}` 
      });
      localStorage.setItem('activity_logs', JSON.stringify(logs.slice(0, 50)));
    }
  } catch (err) {
    console.error('Error logging activity:', err);
  }
}
