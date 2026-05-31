"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { recentMessages } from "@/data/chat-data";
import { notifications } from "@/data/notifications";
import { Bell, BookOpen, LayoutDashboard, LogIn, LogOut, Mail, MessageSquare, PanelLeftClose, PanelRightClose, Swords, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ChatDrawer from "../header/ChatDrawer";
import NotificationDrawer from "../header/NotificationDrawer";
import { useSidebar } from "./sidebar-context";

const BRAND_NAME = "brainspark";
const SHOW_HEADER_COMMUNICATIONS = false;

export function Header({ showSidebar = true }: { showSidebar?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleCollapsed, collapsed } = useSidebar();
  const [isMessagesDrawerOpen, setIsMessagesDrawerOpen] = useState(false);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string; pseudo: string; avatarUrl: string | null } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const isIqArea = pathname === "/iq" || pathname.startsWith("/iq/") || pathname.startsWith("/iq-");

  // Close drawers when navigating to a new page
  useEffect(() => {
    setIsMessagesDrawerOpen(false);
    setIsNotificationsDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;

    if (isIqArea) {
      setCurrentUser(null);
      setIsAuthLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const loadCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const payload = await response.json();

        if (isMounted) {
          setCurrentUser(payload.user ?? null);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [isIqArea, pathname]);

  useEffect(() => {
    const handleUserUpdated = (event: Event) => {
      const updatedUser = (event as CustomEvent<{ id: number; email: string; pseudo: string; avatarUrl: string | null }>).detail;

      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    };

    window.addEventListener("quizhub:user-updated", handleUserUpdated);

    return () => {
      window.removeEventListener("quizhub:user-updated", handleUserUpdated);
    };
  }, []);

  // Ensure only one drawer can be open at a time
  useEffect(() => {
    if (isMessagesDrawerOpen) {
      setIsNotificationsDrawerOpen(false);
    }
  }, [isMessagesDrawerOpen]);

  useEffect(() => {
    if (isNotificationsDrawerOpen) {
      setIsMessagesDrawerOpen(false);
    }
  }, [isNotificationsDrawerOpen]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const unreadMessagesCount = recentMessages.filter((m) => m.unread).length;
  const username = currentUser ? `@${currentUser.pseudo}` : null;
  const disableBrandNavigation = isIqArea;
  const brandContent = (
    <>
      <BookOpen className="h-6 w-6 text-primary" />
      <span className="text-xl font-bold">{BRAND_NAME}</span>
    </>
  );

  const handleMessageClick = (conversationId: string) => {
    router.push(`/chat?conversation=${conversationId}`);
    setIsMessagesDrawerOpen(false);
  };

  const handleNotificationClick = () => {
    setIsNotificationsDrawerOpen(false);
    // In a real app, you would mark the notification as read here
  };

  const markAllNotificationsAsRead = () => {
    // In a real app, you would call an API to mark all notifications as read
    // For now, we'll just close the drawer
    setIsNotificationsDrawerOpen(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    router.push("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-4">
          {showSidebar ? (
            <Button variant="ghost" size="icon" onClick={toggleCollapsed}>
              {collapsed ? <PanelRightClose className="!text-3xl" /> : <PanelLeftClose className="!text-3xl" />}
            </Button>
          ) : null}
          {disableBrandNavigation ? (
            <span className="flex items-center gap-2" aria-label={BRAND_NAME}>
              {brandContent}
            </span>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              {brandContent}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {SHOW_HEADER_COMMUNICATIONS && !isIqArea ? (
            <>
              <Button variant="outline" size="icon" className="relative shrink-0" onClick={() => setIsMessagesDrawerOpen(true)}>
                <MessageSquare className="h-5 w-5" />
                {unreadMessagesCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">{unreadMessagesCount}</span>}
              </Button>

              <Button variant="outline" size="icon" className="relative shrink-0" onClick={() => setIsNotificationsDrawerOpen(true)}>
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">{unreadNotificationsCount}</span>}
              </Button>
            </>
          ) : null}

          {!isIqArea && !isAuthLoading && !currentUser ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild className="shrink-0 max-sm:px-3">
                <Link href="/login">
                  <LogIn className="h-4 w-4 sm:mr-2" />
                  <span className="max-sm:hidden">Connexion</span>
                </Link>
              </Button>
              <Button asChild className="shrink-0 max-sm:px-3">
                <Link href="/register">
                  <UserPlus className="h-4 w-4 sm:mr-2" />
                  <span className="max-sm:hidden">Inscription</span>
                </Link>
              </Button>
            </div>
          ) : null}

          {!isIqArea && !isAuthLoading && currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="shrink-0 rounded-full gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.avatarUrl || "/placeholder-user.jpg"} className="object-cover object-center" alt={currentUser.pseudo} />
                    <AvatarFallback>{currentUser.pseudo.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="max-md:hidden font-medium">{currentUser.pseudo}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex flex-col space-y-2 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={currentUser.avatarUrl || "/placeholder-user.jpg"} className="object-cover object-center" alt={currentUser.pseudo} />
                      <AvatarFallback>{currentUser.pseudo.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{currentUser.pseudo}</h3>
                      {username ? <p className="text-sm text-muted-foreground">{username}</p> : null}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{currentUser.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <div className="p-2">
                  <DropdownMenuItem asChild className="p-3">
                    <Link href="/settings" className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex flex-col">
                        <span>Mon compte</span>
                        <span className="text-xs text-muted-foreground">Infos personnelles et préférences</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="p-3">
                    <Link href="/dashboard/user" className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100">
                        <LayoutDashboard className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex flex-col">
                        <span>Mes statistiques</span>
                        <span className="text-xs text-muted-foreground">Résultats et activité</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="p-3">
                    <Link href="/duels" className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100">
                        <Swords className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex flex-col">
                        <span>Mes duels</span>
                        <span className="text-xs text-muted-foreground">Défis privés et résultats</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </div>

                <div className="p-4 pt-0">
                  <Button variant="destructive" className="w-full justify-center" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Déconnexion</span>
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </header>

      {/* Overlay for both drawers */}
      {SHOW_HEADER_COMMUNICATIONS ? (
        <>
          <div
            className={`fixed inset-0 bg-black/20 z-50 transition-opacity ${isMessagesDrawerOpen || isNotificationsDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            onClick={() => {
              setIsMessagesDrawerOpen(false);
              setIsNotificationsDrawerOpen(false);
            }}
          />

          <ChatDrawer setIsMessagesDrawerOpen={setIsMessagesDrawerOpen} isMessagesDrawerOpen={isMessagesDrawerOpen} handleMessageClick={handleMessageClick} />

          <NotificationDrawer handleNotificationClick={handleNotificationClick} isNotificationsDrawerOpen={isNotificationsDrawerOpen} markAllNotificationsAsRead={markAllNotificationsAsRead} setIsNotificationsDrawerOpen={setIsNotificationsDrawerOpen} />
        </>
      ) : null}
    </>
  );
}
