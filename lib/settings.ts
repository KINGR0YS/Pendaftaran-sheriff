import { supabase } from './supabase';

export interface SystemSettings {
  active_batch: string;
  recruitment_status: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  active_batch: '1',
  recruitment_status: 'open',
};

// Safe localStorage helper
const getLocal = (key: string, fallback: string): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key) || fallback;
  }
  return fallback;
};

const setLocal = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value');

    if (error) {
      console.warn('Gagal memuat settings dari Supabase, menggunakan fallback localStorage:', error.message);
      return {
        active_batch: getLocal('active_batch', DEFAULT_SETTINGS.active_batch),
        recruitment_status: getLocal('recruitment_status', DEFAULT_SETTINGS.recruitment_status),
      };
    }

    const settings = { ...DEFAULT_SETTINGS };
    if (data && data.length > 0) {
      data.forEach((row: { key: string; value: string }) => {
        if (row.key === 'active_batch') {
          settings.active_batch = row.value;
          setLocal('active_batch', row.value);
        } else if (row.key === 'recruitment_status') {
          settings.recruitment_status = row.value;
          setLocal('recruitment_status', row.value);
        }
      });
    }
    return settings;
  } catch (err) {
    console.error('Error fetching settings:', err);
    return {
      active_batch: getLocal('active_batch', DEFAULT_SETTINGS.active_batch),
      recruitment_status: getLocal('recruitment_status', DEFAULT_SETTINGS.recruitment_status),
    };
  }
}

export async function updateSystemSetting(key: string, value: string): Promise<boolean> {
  try {
    console.log(`[updateSystemSetting] Memulai update untuk key: ${key}, value: ${value}`);
    
    // Coba update dulu
    const { data: existing, error: selectError } = await supabase
      .from('system_settings')
      .select('key')
      .eq('key', key)
      .maybeSingle();

    if (selectError) {
      console.error(`[updateSystemSetting] Error saat select key ${key}:`, selectError);
      throw selectError;
    }

    if (existing) {
      console.log(`[updateSystemSetting] Key ${key} ditemukan, melakukan update...`);
      // Key sudah ada, update value-nya
      const { error } = await supabase
        .from('system_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) {
        console.error(`[updateSystemSetting] Error saat update key ${key}:`, error);
        throw error;
      }
      console.log(`[updateSystemSetting] Update berhasil untuk key ${key}`);
    } else {
      console.log(`[updateSystemSetting] Key ${key} tidak ditemukan, melakukan insert...`);
      // Key belum ada, insert baru
      const { error } = await supabase
        .from('system_settings')
        .insert({ key, value });
      if (error) {
        console.error(`[updateSystemSetting] Error saat insert key ${key}:`, error);
        throw error;
      }
      console.log(`[updateSystemSetting] Insert berhasil untuk key ${key}`);
    }

    return true;
  } catch (err) {
    console.error(`Failed to update setting ${key} in Supabase:`, err);
    return false;
  }
}

/**
 * Mengambil nilai setting dari tabel system_settings langsung dari database.
 * Tidak menggunakan localStorage agar nilai tersinkronasi ke semua pengguna.
 * @param key Nama key setting
 * @param defaultValue Nilai default jika key belum ada di database
 */
export async function getSetting(key: string, defaultValue: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.value ?? defaultValue;
  } catch (err) {
    console.error(`Error fetching setting ${key} from database:`, err);
    return defaultValue;
  }
}

/**
 * Mengambil nilai setting tanggal dari database.
 * Jika key belum ada di DB, otomatis simpan fallbackDate ke DB
 * agar tanggal tidak berubah setiap hari (karena fallback dihitung dinamis).
 */
export async function getDateSetting(key: string, fallbackDate: string): Promise<string> {
  try {
    console.log(`[getDateSetting] Membaca key: ${key}, fallback: ${fallbackDate}`);
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.error(`[getDateSetting] Error saat select key ${key}:`, error);
      throw error;
    }

    // Jika key sudah ada di DB, gunakan nilainya
    if (data?.value) {
      console.log(`[getDateSetting] Ditemukan nilai di DB: ${data.value}`);
      return data.value;
    }

    // Jika key belum ada di DB, simpan fallbackDate agar tidak berubah besok
    console.log(`[getDateSetting] Key ${key} tidak ada di DB, menyimpan fallbackDate: ${fallbackDate}`);
    const { error: insertError } = await supabase
      .from('system_settings')
      .insert({ key, value: fallbackDate });

    if (insertError) {
      console.warn(`Gagal menyimpan default ${key}:`, insertError.message);
    }

    return fallbackDate;
  } catch (err) {
    console.error(`Error fetching date setting ${key} from database:`, err);
    return fallbackDate;
  }
}
