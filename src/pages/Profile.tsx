import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Save, Key, User } from 'lucide-react';

interface ProfileFormData {
  displayName: string;
  bio: string;
}

interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: profileErrors }, reset: resetProfile } = useForm<ProfileFormData>();
  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: passwordErrors }, reset: resetPassword, watch } = useForm<PasswordFormData>();

  useEffect(() => {
    if (currentUser) {
      fetchUserProfile();
    }
  }, [currentUser]);

  const fetchUserProfile = async () => {
    if (!currentUser) return;
    
    setProfileError(null);
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) throw error;

      if (userData) {
        setUserProfile(userData);
        resetProfile({
          displayName: userData.display_name || '',
          bio: userData.bio || ''
        });
      } else {
        // Profile doesn't exist, it will be created by the trigger
        // Wait a moment and try again
        setTimeout(() => {
          fetchUserProfile();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      setProfileError('Erro ao carregar perfil. Verifique sua conexão e tente novamente.');
    }
  };

  const handleProfileSubmit = async (data: ProfileFormData) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      let photoUrl = userProfile?.photo_url || '';

      // Upload new avatar if selected
      if (avatarFile) {
        const avatarFileName = `${currentUser.id}/${Date.now()}_${avatarFile.name}`;
        const { data: avatarUpload, error: avatarError } = await supabase.storage
          .from('avatars')
          .upload(avatarFileName, avatarFile);

        if (avatarError) throw avatarError;

        const { data: avatarUrl } = supabase.storage
          .from('avatars')
          .getPublicUrl(avatarUpload.path);

        photoUrl = avatarUrl.publicUrl;
      }

      // Update user profile in database
      const { error } = await supabase
        .from('users')
        .upsert({
          id: currentUser.id,
          display_name: data.displayName,
          bio: data.bio,
          photo_url: photoUrl,
          email: currentUser.email || '',
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      alert('Perfil atualizado com sucesso!');
      setAvatarFile(null);
      fetchUserProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) throw error;

      alert('Senha atualizada com sucesso!');
      resetPassword();
    } catch (error: any) {
      console.error('Error updating password:', error);
      alert('Erro ao atualizar senha: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition-colors`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Perfil
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition-colors`}
            >
              <Key className="w-4 h-4 inline mr-2" />
              Segurança
            </button>
          </nav>
        </div>

        <div className="p-6">
          {profileError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erro de Conexão</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{profileError}</p>
                    <button
                      onClick={fetchUserProfile}
                      className="mt-2 text-red-600 hover:text-red-500 underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleSubmitProfile(handleProfileSubmit)} className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden">
                    {avatarFile ? (
                      <img
                        src={URL.createObjectURL(avatarFile)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : userProfile?.photo_url ? (
                      <img
                        src={userProfile.photo_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-red-600 text-white rounded-full p-2 cursor-pointer hover:bg-red-700 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {userProfile?.display_name || currentUser.email}
                  </h3>
                  <p className="text-gray-600">{currentUser.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Membro desde {new Date(currentUser.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome de usuário
                  </label>
                  <input
                    {...registerProfile('displayName', { 
                      required: 'Nome de usuário é obrigatório',
                      minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' }
                    })}
                    type="text"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="Seu nome de usuário"
                  />
                  {profileErrors.displayName && (
                    <p className="mt-2 text-sm text-red-600">{profileErrors.displayName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={currentUser.email || ''}
                    disabled
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">O e-mail não pode ser alterado</p>
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Biografia
                </label>
                <textarea
                  {...registerProfile('bio', { 
                    maxLength: { value: 500, message: 'Biografia deve ter no máximo 500 caracteres' }
                  })}
                  rows={4}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Conte um pouco sobre você..."
                />
                {profileErrors.bio && (
                  <p className="mt-2 text-sm text-red-600">{profileErrors.bio.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Salvando...' : 'Salvar alterações'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleSubmitPassword(handlePasswordSubmit)} className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Alterar senha</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Certifique-se de usar uma senha forte com pelo menos 6 caracteres.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Nova senha
                </label>
                <input
                  {...registerPassword('newPassword', { 
                    required: 'Nova senha é obrigatória',
                    minLength: { value: 6, message: 'Senha deve ter pelo menos 6 caracteres' }
                  })}
                  type="password"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Digite a nova senha"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-2 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar nova senha
                </label>
                <input
                  {...registerPassword('confirmPassword', {
                    required: 'Confirmação de senha é obrigatória',
                    validate: value => value === watch('newPassword') || 'As senhas não coincidem'
                  })}
                  type="password"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Confirme a nova senha"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Key className="w-4 h-4" />
                  <span>{loading ? 'Alterando...' : 'Alterar senha'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;