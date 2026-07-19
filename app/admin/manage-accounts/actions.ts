'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Helper to verify that the request is made by a superadmin
async function verifySuperAdmin(accessToken: string) {
  if (!accessToken) {
    throw new Error('Autentikasi diperlukan.');
  }

  // Create a temporary client to verify the access token
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
  if (role !== 'superadmin') {
    throw new Error('Hanya Superadmin yang memiliki akses ke fitur ini.');
  }

  return user;
}

export async function listUsers(accessToken: string) {
  try {
    await verifySuperAdmin(accessToken);

    const adminClient = getSupabaseAdmin();
    const { data: { users }, error } = await adminClient.auth.admin.listUsers();
    if (error) throw error;

    return {
      success: true,
      users: users.map(u => ({
        id: u.id,
        email: u.email || '',
        username: u.user_metadata?.username || u.email?.split('@')[0] || 'Unknown',
        role: u.user_metadata?.role === 'admin' ? 'dismag' : (u.user_metadata?.role === 'trainer' ? 'pelatih' : (u.user_metadata?.role || 'dismag')),
        status: u.user_metadata?.status || 'active',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at
      }))
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal memuat daftar pengguna.'
    };
  }
}

export async function forceResetPassword(accessToken: string, targetUserId: string, newPassword: string) {
  try {
    await verifySuperAdmin(accessToken);

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password baru minimal harus 6 karakter.');
    }

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    );

    if (error) throw error;

    // Logout paksa dari semua perangkat (global sign out)
    await adminClient.auth.admin.signOut(targetUserId, 'global');

    return {
      success: true,
      message: `Password untuk akun ${data.user?.email} berhasil direset dan sesi di semua perangkat telah dikeluarkan.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal mereset password.'
    };
  }
}

export async function deleteUser(accessToken: string, targetUserId: string) {
  try {
    const actor = await verifySuperAdmin(accessToken);

    // Prevent deleting yourself
    if (actor.id === targetUserId) {
      throw new Error('Anda tidak dapat menghapus akun Anda sendiri.');
    }

    const adminClient = getSupabaseAdmin();
    const { error } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (error) throw error;

    return {
      success: true,
      message: 'Akun berhasil dihapus permanen.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal menghapus akun.'
    };
  }
}

export async function updateUserStatus(accessToken: string, targetUserId: string, status: 'active' | 'inactive') {
  try {
    const actor = await verifySuperAdmin(accessToken);

    if (actor.id === targetUserId) {
      throw new Error('Anda tidak dapat mengubah status akun Anda sendiri.');
    }

    const adminClient = getSupabaseAdmin();
    
    // Get current user metadata to preserve other fields
    const { data: { user }, error: getError } = await adminClient.auth.admin.getUserById(targetUserId);
    if (getError || !user) throw new Error('Pengguna tidak ditemukan.');

    const currentMetadata = user.user_metadata || {};

    const { data, error } = await adminClient.auth.admin.updateUserById(
      targetUserId,
      {
        user_metadata: {
          ...currentMetadata,
          status: status
        }
      }
    );

    if (error) throw error;

    // Jika dinonaktifkan, keluarkan paksa dari semua perangkat secara instan
    if (status === 'inactive') {
      await adminClient.auth.admin.signOut(targetUserId, 'global');
    }

    return {
      success: true,
      message: `Status akun ${data.user?.email} berhasil diubah menjadi ${status === 'active' ? 'Aktif' : 'Nonaktif'}${status === 'inactive' ? ' dan sesi di semua perangkat telah dikeluarkan' : ''}.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal mengubah status akun.'
    };
  }
}

export async function updateUserRole(accessToken: string, targetUserId: string, newRole: string) {
  try {
    const actor = await verifySuperAdmin(accessToken);

    if (actor.id === targetUserId) {
      throw new Error('Anda tidak dapat mengubah role akun Anda sendiri.');
    }

    const adminClient = getSupabaseAdmin();
    
    // 1. Dapatkan metadata user saat ini untuk menjaga field lain
    const { data: { user }, error: getError } = await adminClient.auth.admin.getUserById(targetUserId);
    if (getError || !user) throw new Error('Pengguna tidak ditemukan.');

    const currentMetadata = user.user_metadata || {};

    // 2. Update role di Supabase Auth metadata
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      targetUserId,
      {
        user_metadata: {
          ...currentMetadata,
          role: newRole
        }
      }
    );

    if (updateError) throw updateError;

    // 3. Sinkronkan role di tabel staff_attendance_members jika user ada di sana
    await adminClient
      .from('staff_attendance_members')
      .update({ role: newRole })
      .eq('user_id', targetUserId);

    return {
      success: true,
      message: `Role akun berhasil diubah menjadi ${newRole.toUpperCase()}.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal memperbarui role akun.'
    };
  }
}
