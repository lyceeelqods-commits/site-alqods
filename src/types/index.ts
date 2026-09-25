export interface Question {
  id: number;
  type: 'qcm' | 'vrai_faux' | 'correct' | 'ordre' | 'lien' | 'tableau' | 'document' | 'short_answer' | 'essay';
  sujet: 'histoire' | 'geographie';
  texte: string;
  options?: string[];
  reponse: string | number[] | Record<string, string>;
  points: number;
  competence: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  explication?: string;
  /** كلمات مفتاحية للتقويم الذاتي في الأسئلة القصيرة والتعبيرية */
  keywords?: string[];
  /** عدد الأسطر المتوقعة لإجابة التعبير الكتابي */
  expectedLines?: number;
}

export interface LevelData {
  id: string;
  label: string;
  description: string;
  reference: string;
  questions: Question[];
  skillsHistory: string[];
  skillsGeo: string[];
}
