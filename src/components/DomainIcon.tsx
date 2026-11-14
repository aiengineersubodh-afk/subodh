import React from "react";
import {
  Cpu,
  Stethoscope,
  Atom,
  Briefcase,
  TrendingUp,
  BookOpen,
  Scale,
  Sprout,
  Network,
  GraduationCap,
} from "lucide-react";

export function DomainIcon({
  name,
  className = "w-6 h-6",
}: {
  name?: string;
  className?: string;
}) {
  switch (name) {
    case "Cpu":
      return <Cpu className={className} />;
    case "Stethoscope":
      return <Stethoscope className={className} />;
    case "Atom":
      return <Atom className={className} />;
    case "Briefcase":
      return <Briefcase className={className} />;
    case "TrendingUp":
      return <TrendingUp className={className} />;
    case "BookOpen":
      return <BookOpen className={className} />;
    case "Scale":
      return <Scale className={className} />;
    case "Sprout":
      return <Sprout className={className} />;
    case "Network":
      return <Network className={className} />;
    default:
      return <GraduationCap className={className} />;
  }
}

