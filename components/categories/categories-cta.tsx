"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Trophy, Users } from "lucide-react";
import Link from "next/link";

export function CategoriesCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-200/50 dark:bg-purple-900/20 blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-indigo-200/50 dark:bg-indigo-900/20 blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full shadow-sm border border-purple-100 dark:border-purple-900/50 mb-4">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Découvrez votre prochain défi</span>
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }} className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Prêt à tester vos connaissances ?
          </motion.h2>

          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} viewport={{ once: true }} className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Choisissez un quiz parmi les catégories disponibles ou créez le vôtre pour défier vos amis et la communauté.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} viewport={{ once: true }} className="flex flex-wrap  gap-4 justify-center">
            <Link href="/explore">
              <Button size="lg" variant={"gradient"}>
                Explorer les quiz
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} viewport={{ once: true }} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-purple-100 dark:border-purple-900/50 p-6 text-center hover:shadow-md transition-all hover:-translate-y-1">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
              <Trophy className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">Jouez et progressez</h3>
            <p className="text-slate-600 dark:text-slate-400">Participez aux quiz, suivez votre progression et grimpez dans les classements.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} viewport={{ once: true }} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-purple-100 dark:border-purple-900/50 p-6 text-center hover:shadow-md transition-all hover:-translate-y-1">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
              <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">Apprendre</h3>
            <p className="text-slate-600 dark:text-slate-400">Développez vos connaissances avec des quiz simples, rapides et interactifs.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} viewport={{ once: true }} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-purple-100 dark:border-purple-900/50 p-6 text-center hover:shadow-md transition-all hover:-translate-y-1">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">Partager</h3>
            <p className="text-slate-600 dark:text-slate-400">Défiez vos amis, partagez vos résultats et rejoignez la communauté.</p>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }} viewport={{ once: true }} className="mt-16 max-w-3xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-purple-100 dark:border-purple-900/50 p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-indigo-500 p-3 rounded-full">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200">500 000+</span> passionnés de quiz ont rejoint la communauté. À vous de jouer.
              </p>
            </div>
            <div className="sm:ml-auto">
              <Link href="/signup">
                <Button variant={"gradient"}>S'inscrire</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
