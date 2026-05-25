export interface PresetTopic {
  id: string;
  title: string;
  category: string;
  description: string;
  defaultProName: string;
  defaultConName: string;
}

export const PRESET_TOPICS: PresetTopic[] = [
  {
    id: "ai-teachers",
    title: "Should AI systems replace human teachers in standard education?",
    category: "Technology & Ethics",
    description: "Fierce debate testing the emotional connection and empathy of human educators against the infinite pacing capacity and hyper-personalization of neural tutors.",
    defaultProName: "Aegis (Neural-Pro)",
    defaultConName: "Vesper (Humanist-Con)"
  },
  {
    id: "mars-colonization",
    title: "Is colonizing Mars a massive waste of earthly resources?",
    category: "Space Exploration",
    description: "Pitting the long-term civilizational survival/exploration drive against immediate, critical humanitarian demands on earth, like poverty and climate crisis.",
    defaultProName: "Aegis (Spaceward-Pro)",
    defaultConName: "Vesper (Earthfirst-Con)"
  },
  {
    id: "fossil-fuels-ban",
    title: "Should we impose an immediate global ban on all fossil fuel vehicles by 2030?",
    category: "Environmental Policy",
    description: "A battle between ambitious climate timeline requirements and global economic/logistic realities of transportation infrastructure transition.",
    defaultProName: "Aegis (Ecopolicy-Pro)",
    defaultConName: "Vesper (Industrial-Con)"
  },
  {
    id: "social-media-anonymity",
    title: "Should anonymous accounts be banned on major social networks?",
    category: "Digital Rights",
    description: "Weighing the shield of cyber-safety and free speech protection against malicious cyberbullying, misinformation campaigns, and accountability.",
    defaultProName: "Aegis (CivicGuard-Pro)",
    defaultConName: "Vesper (LibertyNet-Con)"
  }
];
