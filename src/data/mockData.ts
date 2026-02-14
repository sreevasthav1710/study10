import { Subject } from "@/types/study";

export const initialSubjects: Subject[] = [
  {
    id: "math",
    name: "Mathematics",
    color: "217 91% 60%",
    icon: "📐",
    chapters: [
      {
        id: "math-1",
        name: "Real Numbers",
        completed: false,
        children: [
          { id: "math-1-1", name: "Euclid's Division Lemma", completed: true, children: [] },
          { id: "math-1-2", name: "Fundamental Theorem of Arithmetic", completed: true, children: [] },
          { id: "math-1-3", name: "Irrational Numbers", completed: false, children: [] },
        ],
      },
      {
        id: "math-2",
        name: "Polynomials",
        completed: false,
        children: [
          { id: "math-2-1", name: "Zeros of a Polynomial", completed: false, children: [] },
          { id: "math-2-2", name: "Division Algorithm", completed: false, children: [] },
        ],
      },
      {
        id: "math-3",
        name: "Pair of Linear Equations",
        completed: false,
        children: [
          { id: "math-3-1", name: "Graphical Method", completed: false, children: [] },
          { id: "math-3-2", name: "Substitution Method", completed: false, children: [] },
          { id: "math-3-3", name: "Elimination Method", completed: false, children: [] },
        ],
      },
    ],
  },
  {
    id: "science",
    name: "Science",
    color: "160 70% 42%",
    icon: "🔬",
    chapters: [
      {
        id: "sci-1",
        name: "Chemical Reactions",
        completed: false,
        children: [
          { id: "sci-1-1", name: "Types of Chemical Reactions", completed: true, children: [] },
          { id: "sci-1-2", name: "Balancing Equations", completed: false, children: [] },
        ],
      },
      {
        id: "sci-2",
        name: "Acids, Bases and Salts",
        completed: false,
        children: [
          { id: "sci-2-1", name: "Properties of Acids", completed: false, children: [] },
          { id: "sci-2-2", name: "pH Scale", completed: false, children: [] },
        ],
      },
    ],
  },
  {
    id: "english",
    name: "English",
    color: "280 60% 55%",
    icon: "📖",
    chapters: [
      {
        id: "eng-1",
        name: "First Flight - Prose",
        completed: false,
        children: [
          { id: "eng-1-1", name: "A Letter to God", completed: true, children: [] },
          { id: "eng-1-2", name: "Nelson Mandela", completed: true, children: [] },
          { id: "eng-1-3", name: "Two Stories about Flying", completed: false, children: [] },
        ],
      },
      {
        id: "eng-2",
        name: "Writing Skills",
        completed: false,
        children: [
          { id: "eng-2-1", name: "Letter Writing", completed: false, children: [] },
          { id: "eng-2-2", name: "Essay Writing", completed: false, children: [] },
        ],
      },
    ],
  },
  {
    id: "sst",
    name: "Social Science",
    color: "30 80% 55%",
    icon: "🌍",
    chapters: [
      {
        id: "sst-1",
        name: "The Rise of Nationalism in Europe",
        completed: false,
        children: [
          { id: "sst-1-1", name: "The French Revolution", completed: false, children: [] },
          { id: "sst-1-2", name: "Making of Nationalism in Europe", completed: false, children: [] },
        ],
      },
    ],
  },
  {
    id: "hindi",
    name: "Hindi",
    color: "0 70% 55%",
    icon: "✏️",
    chapters: [
      {
        id: "hin-1",
        name: "क्षितिज भाग 2",
        completed: false,
        children: [
          { id: "hin-1-1", name: "सूरदास के पद", completed: false, children: [] },
          { id: "hin-1-2", name: "राम-लक्ष्मण-परशुराम संवाद", completed: false, children: [] },
        ],
      },
    ],
  },
];
