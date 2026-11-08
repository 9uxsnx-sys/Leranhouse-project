'use client';
import { updateProfile } from '@services/settings/profile'
import { getUser } from '@services/users/users'
import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Formik, Form } from 'formik'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import {
  UploadCloud,
  AlertTriangle,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Check,
  SaveAllIcon
} from 'lucide-react'
import { updateUserAvatar, deleteUserAvatar, updateUserBanner, deleteUserBanner, checkUsernameAvailability } from '@services/users/users'
import { constructAcceptValue } from '@/lib/constants'
import * as Yup from 'yup'
import { Input } from "@components/ui/input"
import { Textarea } from "@components/ui/textarea"
import { Label } from "@components/ui/label"
import { toast } from 'react-hot-toast'
import { signOut } from '@components/Contexts/AuthContext'
import { getUriWithoutOrg } from '@services/config/config';
import { useTranslation } from 'react-i18next';

const SUPPORTED_FILES = constructAcceptValue(['jpg', 'png', 'webp', 'gif'])

interface FormValues {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  bio: string;
}

const fieldClassName = "bg-ui-bg-field !shadow-none border border-ui-border-base focus:border-ui-border-strong focus-visible:!shadow-none transition-none";

// Form component to handle the details section
const UserEditForm = ({
  values,
  setFieldValue,
  handleChange,
  errors,
  touched,
  isSubmitting,
  profilePicture,
  banner,
  hasAvatar,
  hasBanner,
  handleDeleteAvatar,
  handleDeleteBanner,
  dirty,
  isSaved
}: {
  values: FormValues;
  setFieldValue: (field: string, value: any) => void;
  handleChange: (e: React.ChangeEvent<any>) => void;
  errors: any;
  touched: any;
  isSubmitting: boolean;
  profilePicture: {
    isLoading: boolean;
    localAvatar: File | null;
    handleFileChange: (event: any) => Promise<void>;
  };
  banner: {
    localBanner: File | null;
    isUploading: boolean;
    handleFileChange: (event: any) => Promise<void>;
  };
  hasAvatar: boolean;
  hasBanner: boolean;
  handleDeleteAvatar: () => void;
  handleDeleteBanner: () => void;
  dirty: boolean;
  isSaved: boolean;
}) => {
  const { t } = useTranslation();
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  return (
    <Form>
      <div className="space-y-6">
        {/* Card 1: Account Details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('user.settings.general.account_details')}
          </h3>
          <div className="space-y-5">
            <div>
              <Label htmlFor="email" className="font-medium leading-[35px] text-black text-sm">{t('user.settings.general.email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                placeholder={t('user.settings.general.email_placeholder')}
                className={fieldClassName}
              />
              {touched.email && errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
              {values.email !== values.email && (
                <div className="flex items-center space-x-2 mt-2 text-amber-600 bg-amber-50 p-2 rounded-md">
                  <AlertTriangle size={16} />
                  <span className="text-sm">{t('user.settings.general.logout_warning')}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="username" className="font-medium leading-[35px] text-black text-sm">{t('user.settings.general.username')}</Label>
              <Input
                id="username"
                name="username"
                value={values.username}
                onChange={handleChange}
                placeholder={t('user.settings.general.username_placeholder')}
                className={fieldClassName}
              />
              {touched.username && errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Profile Information */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('user.settings.general.profile_information')}
          </h3>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name" className="font-medium leading-[35px] text-black text-sm">{t('user.settings.general.first_name')}</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={values.first_name}
                  onChange={handleChange}
                  placeholder={t('user.settings.general.first_name_placeholder')}
                  className={fieldClassName}
                />
                {touched.first_name && errors.first_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name" className="font-medium leading-[35px] text-black text-sm">{t('user.settings.general.last_name')}</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={values.last_name}
                  onChange={handleChange}
                  placeholder={t('user.settings.general.last_name_placeholder')}
                  className={fieldClassName}
                />
                {touched.last_name && errors.last_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="bio" className="font-medium leading-[35px] text-black text-sm">
                {t('user.settings.general.bio')}
                <span className="text-gray-500 text-sm ms-2">
                  ({t('user.settings.general.characters_left', { count: 400 - (values.bio?.length || 0) })})
                </span>
              </Label>
              <Textarea
                id="bio"
                name="bio"
                value={values.bio}
                onChange={handleChange}
                placeholder={t('user.settings.general.bio_placeholder')}
                className={`${fieldClassName} min-h-[80px]`}
                maxLength={400}
              />
              {touched.bio && errors.bio && (
                <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Profile Picture & Banner */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">
            {t('user.settings.general.profile_picture')}
          </h3>
          <div className="space-y-3">
            {/* Avatar Row */}
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <div className="flex-shrink-0">
                <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{t('user.settings.general.profile_picture')}</p>
              </div>
              {profilePicture.isLoading ? (
                <div className="w-[18px] h-[18px] border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    className="hidden"
                    accept={SUPPORTED_FILES}
                    onChange={profilePicture.handleFileChange}
                  />
                  {hasAvatar ? (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove avatar"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      title={t('user.settings.general.change_avatar')}
                    >
                      <UploadCloud size={18} />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Banner Row */}
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <div className="flex-shrink-0">
                <ImageIcon size={24} className="text-gray-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{t('user.settings.appearance.profile_banner')}</p>
              </div>
              {banner.isUploading ? (
                <div className="w-[18px] h-[18px] border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    className="hidden"
                    accept={SUPPORTED_FILES}
                    onChange={banner.handleFileChange}
                  />
                  {hasBanner ? (
                    <button
                      type="button"
                      onClick={handleDeleteBanner}
                      className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove banner"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      title="Upload banner"
                    >
                      <UploadCloud size={18} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
              isSubmitting
                ? 'bg-black text-white border-black opacity-50 cursor-not-allowed'
                : !dirty && isSaved
                  ? 'bg-white text-gray-600 border-gray-200 cursor-default'
                  : 'bg-black text-white border-black hover:opacity-90 cursor-pointer'
            }`}
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : !dirty && isSaved ? (
              <Check size={14} />
            ) : (
              <SaveAllIcon size={14} />
            )}
            <span>
              {isSubmitting ? t('user.settings.general.saving') : !dirty && isSaved ? t('user.settings.general.saved') : t('user.settings.general.save_changes')}
            </span>
          </button>
        </div>
      </div>
    </Form>
  );
};

function AccountGeneral() {
  const session = useLHSession() as any;
  const access_token = session?.data?.tokens?.access_token;
  const [localAvatar, setLocalAvatar] = React.useState(null) as any
  const [isLoading, setIsLoading] = React.useState(false) as any
  const [localBanner, setLocalBanner] = React.useState(null) as any
  const [bannerUploading, setBannerUploading] = React.useState(false) as any
  const [userData, setUserData] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(true);
  const { t } = useTranslation();
  const pendingCheckRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const validationSchema = useMemo(() => Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
    username: Yup.string()
      .required('Username is required')
      .test('username-available', t('user.settings.general.username_taken'), async function(value) {
        if (!value || value === userData?.username) return true

        // Cancel previous pending check
        pendingCheckRef.current.cancelled = true
        const currentCheck = { cancelled: false }
        pendingCheckRef.current = currentCheck

        // Debounce: wait 500ms before making the API call
        await new Promise(r => setTimeout(r, 500))
        if (currentCheck.cancelled) return true

        try {
          const result = await checkUsernameAvailability(value, access_token)
          return result.available !== false
        } catch {
          return true // Allow on error to not block form submission
        }
      }),
    first_name: Yup.string().required('First name is required'),
    last_name: Yup.string().required('Last name is required'),
    bio: Yup.string().max(400, 'Bio must be 400 characters or less'),
  }), [userData?.username, access_token, t]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.data?.user?.id) {
        try {
          const data = await getUser(session.data.user.id, access_token);
          setUserData(data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [session?.data?.user?.id, access_token]);

  const handleFileChange = async (event: any) => {
    const file = event.target.files[0]
    if (!file) return

    // File validation
    const MAX_FILE_SIZE = 8_000_000
    const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 8MB', { duration: 3000 })
      event.target.value = ''
      return
    }
    if (!VALID_TYPES.includes(file.type)) {
      toast.error('Only JPG and PNG files are allowed', { duration: 3000 })
      event.target.value = ''
      return
    }

    setLocalAvatar(file)
    setIsLoading(true)
    const res = await updateUserAvatar(session.data.user.id, file, access_token)
    if (res.success === false) {
      toast.error(res.HTTPmessage || 'Failed to upload avatar', { duration: 3000 })
      setIsLoading(false)
    } else {
      // Update local state with the new avatar_image from response
      const newAvatar = res.data?.avatar_image
      if (newAvatar) {
        setUserData((prev: any) => prev ? { ...prev, avatar_image: newAvatar } : prev)
      }
      await session.update(true)
      setIsLoading(false)
      toast.success(t('user.settings.general.avatar_updated'), { duration: 3000 })
    }
  }

  const handleDeleteAvatar = async () => {
    const loadingToast = toast.loading('Removing avatar...')
    try {
      const res = await deleteUserAvatar(session.data.user.id, access_token)
      if (res.success === false) {
        toast.error(res.HTTPmessage || 'Failed to remove avatar', { id: loadingToast })
      } else {
        setUserData((prev: any) => prev ? { ...prev, avatar_image: null } : prev)
        await session.update(true)
        toast.success('Avatar removed successfully', { id: loadingToast })
      }
    } catch (error: any) {
      toast.error('Failed to remove avatar', { id: loadingToast })
    }
  }

  const handleBannerFileChange = async (event: any) => {
    const file = event.target.files[0]
    if (!file) return

    // File validation
    const MAX_FILE_SIZE = 8_000_000
    const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 8MB', { duration: 3000 })
      event.target.value = ''
      return
    }
    if (!VALID_TYPES.includes(file.type)) {
      toast.error('Only JPG and PNG files are allowed', { duration: 3000 })
      event.target.value = ''
      return
    }

    setLocalBanner(file)
    setBannerUploading(true)
    const res = await updateUserBanner(session.data.user.id, file, access_token)
    if (res.success === false) {
      toast.error(res.HTTPmessage || 'Failed to upload banner', { duration: 3000 })
      setBannerUploading(false)
    } else {
      const newBanner = res.data?.banner_image
      if (newBanner) {
        setUserData((prev: any) => prev ? { ...prev, banner_image: newBanner } : prev)
      }
      await session.update(true)
      setBannerUploading(false)
      toast.success('Banner uploaded successfully', { duration: 3000 })
    }
  }

  const handleDeleteBanner = async () => {
    const loadingToast = toast.loading('Removing banner...')
    try {
      const res = await deleteUserBanner(session.data.user.id, access_token)
      if (res.success === false) {
        toast.error(res.HTTPmessage || 'Failed to remove banner', { id: loadingToast })
      } else {
        setUserData((prev: any) => prev ? { ...prev, banner_image: null } : prev)
        await session.update(true)
        toast.success('Banner removed successfully', { id: loadingToast })
      }
    } catch (error: any) {
      toast.error('Failed to remove banner', { id: loadingToast })
    }
  }

  const handleEmailChange = async (newEmail: string) => {
    toast.success(t('user.settings.general.profile_updated'), { duration: 4000 })

    toast((t_toast: any) => (
      <div className="flex items-center gap-2">
        <span>{t('user.settings.general.relogin_message', { email: newEmail })}</span>
      </div>
    ), {
      duration: 4000,
      icon: '📧'
    })

    await new Promise(resolve => setTimeout(resolve, 4000))
    signOut({ redirect: true, callbackUrl: getUriWithoutOrg('/') })
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <Formik<FormValues>
        enableReinitialize
        initialValues={{
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          bio: userData.bio || '',

        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          const isEmailChanged = values.email !== userData.email
          const loadingToast = toast.loading(t('user.settings.general.saving'))

          setTimeout(() => {
            updateProfile(values, userData.id, access_token)
              .then(() => {
                toast.dismiss(loadingToast)
                setIsSaved(true)
                if (isEmailChanged) {
                  handleEmailChange(values.email)
                } else {
                  toast.success(t('user.settings.general.profile_updated'))
                }
                getUser(userData.id, access_token).then(setUserData);
              })
              .catch((error: any) => {
                const message = error?.message || error?.detail || 'Failed to update profile'
                toast.error(message, { id: loadingToast })
              })
              .finally(() => {
                setSubmitting(false)
              })
          }, 400)
        }}
      >
        {(formikProps) => (
          <UserEditForm
            {...formikProps}
            profilePicture={{
              isLoading,
              localAvatar,
              handleFileChange
            }}
            banner={{
              localBanner,
              isUploading: bannerUploading,
              handleFileChange: handleBannerFileChange
            }}
            hasAvatar={!!userData?.avatar_image}
            hasBanner={!!userData?.banner_image}
            handleDeleteAvatar={handleDeleteAvatar}
            handleDeleteBanner={handleDeleteBanner}
            dirty={formikProps.dirty}
            isSaved={isSaved}
          />
        )}
      </Formik>
    </div>
  );
}

export default AccountGeneral
