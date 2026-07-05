'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Helper to verify that the requester is a valid staff member
async function verifyStaffSession(accessToken: string) {
  if (!accessToken) {
    throw new Error('Autentikasi diperlukan.');
  }

  const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data: { user }, error } = await tempClient.auth.getUser(accessToken);
  
  if (error || !user) {
    throw new Error('Sesi tidak valid.');
  }

  const role = user.user_metadata?.role || 'dismag';
  const normalizedRole = role === 'admin' ? 'dismag' : (role === 'trainer' ? 'pelatih' : role);
  
  if (!['pelatih', 'dismag', 'superadmin'].includes(normalizedRole)) {
    throw new Error('Akses ditolak.');
  }

  return user;
}

export async function listRegisteredAccounts(accessToken: string) {
  try {
    await verifyStaffSession(accessToken);

    const adminClient = getSupabaseAdmin();
    const { data: { users }, error } = await adminClient.auth.admin.listUsers();
    if (error) throw error;

    return {
      success: true,
      users: users.map(u => {
        const role = u.user_metadata?.role || 'dismag';
        const normalizedRole = role === 'admin' ? 'dismag' : (role === 'trainer' ? 'pelatih' : role);
        return {
          id: u.id,
          email: u.email || '',
          username: u.user_metadata?.username || u.email?.split('@')[0] || 'Unknown',
          role: normalizedRole
        };
      })
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal memuat daftar akun terdaftar.'
    };
  }
}

export async function addStaffMember(accessToken: string, userId: string, username: string, role: string) {
  try {
    await verifyStaffSession(accessToken);

    const adminClient = getSupabaseAdmin();
    
    // Check if already exists in staff_attendance_members
    const { data: existing, error: checkError } = await adminClient
      .from('staff_attendance_members')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (checkError) throw checkError;
    if (existing) {
      throw new Error('Akun ini sudah ditambahkan ke dalam daftar absensi.');
    }

    const { error: insertError } = await adminClient
      .from('staff_attendance_members')
      .insert([{
        user_id: userId,
        username,
        role
      }]);

    if (insertError) throw insertError;

    return {
      success: true,
      message: 'Anggota staff berhasil ditambahkan.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menambahkan anggota staff.'
    };
  }
}

export async function removeStaffMember(accessToken: string, userId: string) {
  try {
    await verifyStaffSession(accessToken);

    const adminClient = getSupabaseAdmin();
    const { error } = await adminClient
      .from('staff_attendance_members')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    return {
      success: true,
      message: 'Anggota staff berhasil dihapus dari daftar absensi.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menghapus anggota staff.'
    };
  }
}
