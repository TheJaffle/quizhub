"use client";

import type React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ProfileSettingsProps = {
  user: {
    id: number;
    email: string;
    pseudo: string;
    fullName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    birthDate: string | null;
    gender: string | null;
    newsletterOptIn: boolean;
    notificationsOptIn: boolean;
    passwordSetupRequired: boolean;
  };
  avatarPresets: {
    id: number;
    name: string;
    imageUrl: string;
  }[];
};

export function ProfileSettings({ avatarPresets, user }: ProfileSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    name: user.fullName ?? user.pseudo,
    username: user.pseudo,
    email: user.email,
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl ?? "",
    birthDate: user.birthDate ?? "",
    gender: user.gender ?? "",
  });
  const avatarFallback = formData.username.slice(0, 2).toUpperCase() || "U";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePresetSelect = (avatarUrl: string) => {
    setFormData((prev) => ({ ...prev, avatarUrl }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const uploadData = new FormData();
      uploadData.append("avatar", file);

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: uploadData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible de téléverser l'avatar.");
      }

      const updatedUser = payload.user as {
        id: number;
        email: string;
        pseudo: string;
        fullName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        birthDate: string | null;
        gender: string | null;
        newsletterOptIn: boolean;
        notificationsOptIn: boolean;
        passwordSetupRequired: boolean;
      };
      setFormData((current) => ({
        ...current,
        avatarUrl: updatedUser.avatarUrl ?? "",
      }));
      window.dispatchEvent(new CustomEvent("quizhub:user-updated", { detail: updatedUser }));
      toast.success("Avatar mis à jour.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de téléverser l'avatar.");
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          pseudo: formData.username,
          fullName: formData.name,
          bio: formData.bio,
          avatarUrl: formData.avatarUrl,
          birthDate: formData.birthDate,
          gender: formData.gender,
          newsletterOptIn: user.newsletterOptIn,
          notificationsOptIn: user.notificationsOptIn,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Impossible de mettre à jour le profil.");
      }

      const updatedUser = payload.user as {
        id: number;
        email: string;
        pseudo: string;
        fullName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        birthDate: string | null;
        gender: string | null;
        newsletterOptIn: boolean;
        notificationsOptIn: boolean;
        passwordSetupRequired: boolean;
      };
      setFormData((current) => ({
        ...current,
        name: updatedUser.fullName ?? updatedUser.pseudo,
        username: updatedUser.pseudo,
        email: updatedUser.email,
        bio: updatedUser.bio ?? "",
        avatarUrl: updatedUser.avatarUrl ?? "",
        birthDate: updatedUser.birthDate ?? "",
        gender: updatedUser.gender ?? "",
      }));
      window.dispatchEvent(new CustomEvent("quizhub:user-updated", { detail: updatedUser }));
      toast.success("Profil mis à jour.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de mettre à jour le profil.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Informations personnelles</h3>
        <p className="text-sm text-muted-foreground">Modifiez votre pseudo, votre email, votre avatar et les informations utiles à votre compte.</p>
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={formData.avatarUrl || "/placeholder-user.jpg"} className="object-cover object-center" alt="Profil" />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          <Button variant="outline" size="sm" className="relative" disabled={isUploadingAvatar}>
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept="image/jpeg,image/png,image/webp"
              disabled={isUploadingAvatar}
              onChange={handleAvatarUpload}
            />
            {isUploadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
            {isUploadingAvatar ? "Téléversement..." : "Changer l'avatar"}
          </Button>
          <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP. 2 Mo maximum.</p>
        </div>
      </div>

      {avatarPresets.length > 0 ? (
        <div className="space-y-3">
          <Label>Choisir un avatar prédéfini</Label>
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
            {avatarPresets.map((preset) => {
              const isSelected = formData.avatarUrl === preset.imageUrl;

              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-label={preset.name}
                  aria-pressed={isSelected}
                  onClick={() => handlePresetSelect(preset.imageUrl)}
                  className={`rounded-full border-2 p-1 transition-colors ${
                    isSelected ? "border-primary" : "border-transparent hover:border-border"
                  }`}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={preset.imageUrl} className="object-cover object-center" alt={preset.name} />
                    <AvatarFallback>{String(preset.id).padStart(2, "0")}</AvatarFallback>
                  </Avatar>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Pseudo</Label>
          <Input id="username" name="username" value={formData.username} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">Date de naissance</Label>
          <Input id="birthDate" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} />
        </div>

        <div className="space-y-3">
          <Label>Sexe</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { value: "female", label: "Femme" },
              { value: "male", label: "Homme" },
              { value: "other", label: "Autre" },
              { value: "prefer_not_to_say", label: "Je préfère ne pas répondre" },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={formData.gender === option.value}
                  onChange={handleChange}
                  className="h-4 w-4 accent-primary"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Full name and bio remain in local/server logic, but are intentionally hidden from the current UI. */}

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer les modifications
        </Button>
      </form>
    </div>
  );
}
