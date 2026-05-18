import { BookOpen, Mail, MapPin } from "lucide-react";
import Link from "next/link";

const footerConfig = {
  brandName: "QI-FREE",
  companyName: "Wildspark",
  description: "Des quiz et tests gratuits pour s'entrainer, apprendre et suivre sa progression.",
  address: "7 Allee des Hormets, 69890 La Tour-de-Salvagny, France",
  email: "b.dindelli@wildspark.fr",
  navigation: [
    { label: "Accueil", href: "/" },
    { label: "Catégories", href: "/categories" },
    { label: "Mon compte", href: "/settings" },
    { label: "Mes statistiques", href: "/dashboard/user" },
  ],
  legal: [
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "Conditions générales d'utilisation", href: "/conditions-generales-utilisation" },
    { label: "Politique de confidentialité", href: "/politique-confidentialite" },
    { label: "Cookies", href: "/cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-white to-slate-100 dark:from-slate-950 dark:to-slate-900 pt-16 pb-8 sm:px-4 xl:px-8">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{footerConfig.brandName}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">{footerConfig.description}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Service entièrement gratuit édité par {footerConfig.companyName}.</p>
          </div>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="space-y-5">
                <h3 className="text-base font-bold relative inline-block">
                  Navigation
                  <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500"></span>
                </h3>
                <ul className="space-y-3">
                  {footerConfig.navigation.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-5">
                <h3 className="text-base font-bold relative inline-block">
                  Informations légales
                  <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500"></span>
                </h3>
                <ul className="space-y-3">
                  {footerConfig.legal.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-5">
                <h3 className="text-base font-bold relative inline-block">
                  Contact
                  <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500"></span>
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <div className="flex-shrink-0 bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                      <MapPin className="h-4 w-4 text-purple-500" />
                    </div>
                    <span className="text-slate-600 dark:text-slate-400">{footerConfig.address}</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="flex-shrink-0 bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                      <Mail className="h-4 w-4 text-purple-500" />
                    </div>
                    <a href={`mailto:${footerConfig.email}`} className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      {footerConfig.email}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} {footerConfig.companyName}. Tous droits réservés.
            </p>
            <p className="text-slate-500 dark:text-slate-400">QI-FREE est gratuit et ne propose aucun achat en ligne.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
