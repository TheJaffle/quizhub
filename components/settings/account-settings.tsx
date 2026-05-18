"use client"

import { ProfileSettings } from "./profile-settings"
import { SecuritySettings } from "./security-settings"
import { NotificationSettings } from "./notification-settings"
import { PageHeader } from "../ui/page-header"

type AccountSettingsProps = {
  user: {
    id: number
    email: string
    pseudo: string
    fullName: string | null
    bio: string | null
    avatarUrl: string | null
    birthDate: string | null
    gender: string | null
    newsletterOptIn: boolean
    notificationsOptIn: boolean
    passwordSetupRequired: boolean
  }
  avatarPresets: {
    id: number
    name: string
    imageUrl: string
  }[]
}

export function AccountSettings({ avatarPresets, user }: AccountSettingsProps) {
  return (
    <div className="container mx-auto">
      <PageHeader title="Mon compte" description="Gérez vos informations personnelles, votre avatar et vos préférences." />

      <div className="mt-6 space-y-6">
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <ProfileSettings avatarPresets={avatarPresets} user={user} />
        </div>

        <SecuritySettings passwordSetupRequired={user.passwordSetupRequired} />

        <NotificationSettings user={user} />
      </div>
    </div>
  )
}
