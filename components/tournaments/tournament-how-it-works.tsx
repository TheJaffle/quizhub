"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Calendar, CheckCircle, Trophy, Users } from "lucide-react";

export function TournamentHowItWorks() {
  const steps = [
    {
      number: "01",
      icon: <Calendar className="h-5 w-5" />,
      title: "Inscription",
      description: "Parcourez les tournois à venir et inscrivez-vous à ceux qui correspondent à vos envies et à votre niveau.",
    },
    {
      number: "02",
      icon: <Users className="h-5 w-5" />,
      title: "Préparation",
      description: "Révisez le thème, entraînez-vous avec des quiz proches et consultez les règles.",
    },
    {
      number: "03",
      icon: <CheckCircle className="h-5 w-5" />,
      title: "Participation",
      description: "Participez à plusieurs manches contre d’autres joueurs.",
    },
    {
      number: "04",
      icon: <Trophy className="h-5 w-5" />,
      title: "Victoire",
      description: "Les meilleurs gagnent des récompenses, badges et places dans le classement global.",
    },
  ];

  return (
    <section className="py-10 xl:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Comment fonctionnent les tournois</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Les tournois rendent les quiz plus ludiques, compétitifs et motivants.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }} viewport={{ once: true }}>
              <Card className="h-full border border-border hover:border-primary/20 transition-colors duration-300 overflow-hidden">
                <CardContent className="p-6 xl:pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">{step.icon}</div>
                    <span className="text-2xl font-light text-muted-foreground/50">{step.number}</span>
                  </div>

                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg mb-4">Prêt à tester vos connaissances ?</p>
          <Button size="lg" className="px-6">
            Rejoindre un tournoi
          </Button>
        </div>
      </div>
    </section>
  );
}
