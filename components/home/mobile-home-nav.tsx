import { Grid2X2, Home, Swords, Trophy, User } from "lucide-react";
import Link from "next/link";

const navItems = [
  { label: "Accueil", href: "#top", icon: Home, active: true },
  { label: "Catégories", href: "#categories", icon: Grid2X2 },
  { label: "Défis", href: "#challenges", icon: Swords },
  { label: "Scores", href: "/leaderboard", icon: Trophy },
  { label: "Compte", href: "/settings", icon: User },
];

export function MobileHomeNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur md:hidden" aria-label="Navigation mobile de la page d'accueil">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map(({ label, href, icon: Icon, active }) => (
          <Link key={label} href={href} className="flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-[#E91663]">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? "bg-[#E91663] text-white shadow-lg shadow-[#E91663]/25" : "text-[#E91663]"}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="leading-none">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
