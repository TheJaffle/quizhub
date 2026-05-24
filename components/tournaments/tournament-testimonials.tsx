"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type Testimonial = {
  id: number;
  name: string;
  avatar: string;
  role: string;
  rating: number;
  text: string;
  tournament: string;
};

export function TournamentTestimonials() {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Alex Johnson",
      avatar: "/avatars/alex.png",
      role: "Passionné d’histoire",
      rating: 5,
      text: "Le tournoi d’histoire était très bien organisé. Les questions étaient exigeantes mais justes, et le format en direct rendait chaque manche captivante.",
      tournament: "Championnat d’histoire mondiale",
    },
    {
      id: 2,
      name: "Sarah Williams",
      avatar: "/avatars/sarah.webp",
      role: "Professeure de sciences",
      rating: 5,
      text: "En tant que professeure de sciences, j’ai apprécié la précision des questions. C’était une excellente expérience d’apprentissage.",
      tournament: "Grand tournoi sciences",
    },
    {
      id: 3,
      name: "Michael Chen",
      avatar: "/avatars/wizard.webp",
      role: "Champion de quiz",
      rating: 4,
      text: "J’ai participé à de nombreuses compétitions de quiz en ligne, et le suivi en temps réel rend les manches vraiment motivantes.",
      tournament: "Maîtres de culture générale",
    },
    {
      id: 4,
      name: "Emily Rodriguez",
      avatar: "/avatars/guru.png",
      role: "Passionnée de littérature",
      rating: 5,
      text: "Le tournoi de littérature a dépassé mes attentes. Les questions étaient bien construites et couvraient beaucoup d’œuvres.",
      tournament: "Défi littérature classique",
    },
    {
      id: 5,
      name: "David Kim",
      avatar: "/avatars/king.webp",
      role: "Passionné de maths",
      rating: 4,
      text: "Le tournoi maths et logique était stimulant. Les manches chronométrées testent vraiment la réflexion sous pression.",
      tournament: "Maîtres maths et logique",
    },
    {
      id: 6,
      name: "Jessica Taylor",
      avatar: "/testimonials/jessica.png",
      role: "Fan de quiz",
      rating: 5,
      text: "J’aime le format avec qualifications et finale. Tout le monde a sa chance, tout en récompensant les connaissances.",
      tournament: "Duel pop culture",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoplay, testimonials.length]);

  const handlePrev = () => {
    setAutoplay(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setAutoplay(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const handleDotClick = (index: number) => {
    setAutoplay(false);
    setCurrentIndex(index);
  };

  return (
    <section className="py-16 mt-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Ce que disent les joueurs</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">Quelques retours de joueurs qui ont participé aux tournois</p>
      </div>

      <div className="relative max-w-4xl mx-auto px-4" onMouseEnter={() => setAutoplay(false)} onMouseLeave={() => setAutoplay(true)}>
        <button onClick={handlePrev} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-md border border-border hover:bg-muted transition-colors" aria-label="Témoignage précédent">
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="overflow-hidden">
          <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-card rounded-xl shadow-lg p-8 border border-border">
                  <div className="flex items-center mb-6">
                    <div className="mr-4">
                      <Image src={testimonial.avatar || "/placeholder.svg"} width={48} height={48} alt={testimonial.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{testimonial.name}</h3>
                      <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                      <div className="flex mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <blockquote className="relative">
                    <span className="absolute top-0 left-0 text-6xl text-primary/20">"</span>
                    <p className="pl-6 pt-2 italic text-muted-foreground">{testimonial.text}</p>
                  </blockquote>

                  <div className="mt-6 pt-4 border-t border-border">
                    <p className="text-sm font-medium">
                      Tournoi : <span className="text-primary">{testimonial.tournament}</span>
                    </p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleNext} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-md border border-border hover:bg-muted transition-colors" aria-label="Témoignage suivant">
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Dots navigation */}
        <div className="flex justify-center mt-6 space-x-2">
          {testimonials.map((_, index) => (
            <button key={index} onClick={() => handleDotClick(index)} className={`w-3 h-3 rounded-full transition-colors ${index === currentIndex ? "bg-primary" : "bg-muted hover:bg-primary/50"}`} aria-label={`Voir le témoignage ${index + 1}`} />
          ))}
        </div>
      </div>

      <div className="text-center mt-12">
        <p className="text-lg font-medium mb-4">Rejoignez plus de 50 000 passionnés de quiz dans nos tournois</p>
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-full font-medium">Voir les tournois à venir</button>
      </div>
    </section>
  );
}
