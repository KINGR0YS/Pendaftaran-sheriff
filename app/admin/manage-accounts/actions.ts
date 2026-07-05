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
        role: u.user_metadata?.role || 'dismag',
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

    return {
      success: true,
      message: `Password untuk akun ${data.user?.email} berhasil direset.`
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
