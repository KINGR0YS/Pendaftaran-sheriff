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
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key, value });

    if (error) {
      throw error;
    }

    setLocal(key, value);
    return true;
  } catch (err) {
    console.error(`Failed to update setting ${key} in Supabase:`, err);
    // Keep local storage updated even if Supabase fails (e.g., table not created yet)
    setLocal(key, value);
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
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      throw error;
    }

    // Jika key sudah ada di DB, gunakan nilainya
    if (data?.value) {
      return data.value;
    }

    // Jika key belum ada di DB, simpan fallbackDate agar tidak berubah besok
    const { error: upsertError } = await supabase
      .from('system_settings')
      .upsert({ key, value: fallbackDate });

    if (upsertError) {
      console.warn(`Gagal menyimpan default ${key}:`, upsertError.message);
    }

    return fallbackDate;
  } catch (err) {
    console.error(`Error fetching date setting ${key} from database:`, err);
    return fallbackDate;
  }
}
