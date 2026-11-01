export interface PresetExample {
  id: string;
  title: string;
  description: string;
  badge: string;
  aiAnswer: string;
  sourceDocument?: string;
}

export const PRESET_EXAMPLES: PresetExample[] = [
  {
    id: 'apollo-hallucination',
    title: 'Apollo 11 Moon Landing (Mixed Facts)',
    badge: 'Google Search Grounding',
    description: 'A historical answer containing true facts mixed with a classic hallucinated astronaut.',
    aiAnswer: `The Apollo 11 mission was launched on July 16, 1969, by NASA from Kennedy Space Center. The lunar module Eagle landed on the Moon on July 20, 1969, in the Sea of Tranquility. Commander Neil Armstrong was the first person to walk on the lunar surface, followed shortly by astronaut John Glenn. The crew safely returned to Earth on July 24, splashing down in the Pacific Ocean.`,
    sourceDocument: '',
  },
  {
    id: 'clinical-trial',
    title: 'Clinical Trial Summary (With Source Doc)',
    badge: 'Source Document Verification',
    description: 'AI summary that exaggerates trial efficacy and invents an unverified side effect.',
    sourceDocument: `Clinical Study Report: Compound ZX-409
Phase II randomized, double-blind trial conducted across 12 medical centers with 450 participants aged 18-65. 
Primary Outcome: At 12 weeks, patients receiving Compound ZX-409 demonstrated a 64% reduction in chronic migraine frequency compared to 22% in the placebo group (p < 0.001).
Safety & Adverse Events: The most frequent treatment-emergent adverse events were mild nausea (14%) and transient dizziness (9%). No serious hepatotoxicity, cardiac arrhythmias, or cognitive impairments were observed during the trial period. 
Conclusion: Compound ZX-409 showed clinically meaningful efficacy and acceptable tolerability for prevention of episodic migraine.`,
    aiAnswer: `According to the clinical trial results for Compound ZX-409, the drug achieved a 92% reduction in migraine frequency over 12 weeks among the 450 participants. The study was a Phase II randomized, double-blind trial. Common side effects included mild nausea in 14% of patients, and approximately 10% of participants experienced acute memory loss.`,
  },
  {
    id: 'python-origin',
    title: 'Python Language Origin (Severe Hallucination)',
    badge: 'Google Search Grounding',
    description: 'An AI text with fabricated creation date, creator, and design philosophy.',
    aiAnswer: `Python is a high-level programming language conceived and created by Google in 2005. It was designed primarily by Dennis Ritchie to replace C++ for machine learning applications. Python was named after Monty Python's Flying Circus and emphasizes code readability with its distinctive use of significant indentation.`,
    sourceDocument: '',
  },
];
