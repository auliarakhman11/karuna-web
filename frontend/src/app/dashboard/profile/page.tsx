'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateProfile, changePassword } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  Save,
} from 'lucide-react';

type AlertState = { type: 'success' | 'error'; message: string } | null;

export default function ProfilePage() {
  const { user, updateProfileState } = useAuth();

  // --- Profile form state ---
  const [name, setName] = useState(user?.name || '');
  const [profileAlert, setProfileAlert] = useState<AlertState>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // --- Password form state ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordAlert, setPasswordAlert] = useState<AlertState>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileAlert(null);
    setProfileLoading(true);

    try {
      const { data } = await updateProfile(name);
      updateProfileState({ name: data.user.name });
      setProfileAlert({ type: 'success', message: 'Profil berhasil diperbarui!' });
    } catch (err: any) {
      setProfileAlert({
        type: 'error',
        message: err.response?.data?.message || 'Gagal memperbarui profil.',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordAlert(null);

    if (newPassword !== confirmPassword) {
      setPasswordAlert({ type: 'error', message: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordAlert({ type: 'error', message: 'Password baru minimal 6 karakter.' });
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword({ oldPassword, newPassword });
      setPasswordAlert({ type: 'success', message: 'Password berhasil diubah!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordAlert({
        type: 'error',
        message: err.response?.data?.message || 'Gagal mengubah password.',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Profile Info Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-5 h-5 text-indigo-400" />
            Informasi Profil
          </CardTitle>
          <CardDescription>Perbarui nama tampilan akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Alamat Email
              </label>
              <Input
                type="email"
                value={user?.email || ''}
                disabled
                className="opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-slate-600">Email tidak dapat diubah.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Nama Lengkap
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap Anda"
                required
              />
            </div>

            {profileAlert && (
              <div
                className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm border ${
                  profileAlert.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                {profileAlert.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                {profileAlert.message}
              </div>
            )}

            <Button type="submit" disabled={profileLoading} className="gap-2">
              {profileLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="w-5 h-5 text-amber-400" />
            Ubah Password
          </CardTitle>
          <CardDescription>Pastikan password baru Anda kuat dan mudah diingat</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Password Saat Ini
              </label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Password Baru
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 karakter"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Konfirmasi Password Baru
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                required
              />
            </div>

            {passwordAlert && (
              <div
                className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm border ${
                  passwordAlert.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                {passwordAlert.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                {passwordAlert.message}
              </div>
            )}

            <Button type="submit" disabled={passwordLoading} className="gap-2">
              {passwordLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengubah...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Ubah Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
