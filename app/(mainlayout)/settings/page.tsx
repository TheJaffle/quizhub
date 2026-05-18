import { AccountSettings } from "@/components/settings/account-settings";
import { getUserAvatarPresets, getUserById } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Mon compte | QI-FREE",
  description: "Gérez vos informations personnelles et vos préférences",
};

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get("quizhub_user_id")?.value);

  if (!Number.isInteger(userId) || userId <= 0) {
    redirect("/login");
  }

  const user = await getUserById(userId);

  if (!user) {
    redirect("/login");
  }

  const avatarPresets = await getUserAvatarPresets();

  return <AccountSettings avatarPresets={avatarPresets} user={user} />;
}
