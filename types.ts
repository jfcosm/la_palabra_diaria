export enum TextSize {
  Small = 'text-base',
  Medium = 'text-lg',
  Large = 'text-xl md:text-2xl'
}

export enum Theme {
  Light = 'light',
  Dark = 'dark'
}

export type LanguageCode = 'es' | 'en' | 'fr' | 'it' | 'de' | 'ko' | 'ja' | 'zh';

export interface ReadingContent {
  title: string;
  reference: string;
  text: string;
  response?: string; // Specifically for Psalm
  acclamation?: string; // Specifically for Gospel
}

export interface DailyReadings {
  date: string;
  liturgical_season: string;
  liturgical_color: string;
  first_reading: ReadingContent;
  psalm: ReadingContent;
  second_reading?: ReadingContent | null; // Optional depending on the day (e.g., weekdays vs Sundays)
  gospel: ReadingContent;
  reflection: {
    title: string;
    text: string;
  };
}

// New interfaces for the Landing Page features
export interface NewsItem {
  title: string;
  summary: string;
  body: string; // Full text content of the news article
  url: string; // Source URL for reference
  source: string;
}

export interface SaintInfo {
  name: string;
  description: string;
  wikipedia_url: string;
}

export interface AudioRef {
  title: string;
  url: string;
  source_name: string;
}

export interface DailyContext {
  saint: SaintInfo;
  news: NewsItem[];
  audio_reflection: AudioRef;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';