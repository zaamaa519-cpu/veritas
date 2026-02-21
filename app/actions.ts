'use server';
import {
  analyzeWithPythonApi,
  fetchNewsFromFlask,
  fetchQuizFromFlask,
  submitQuizToFlask,
  askFlask,
  fetchHistoryFromFlask,
  type PredictionHistoryItem,
} from '@/lib/python-api';
import {
  ClassifyFakeNewsOutput,
  type EnhancedAnalysisOutput,
} from '@/lib/types';

export async function analyzeArticle(
  article: string,
  userId: string | null
): Promise<{ result: EnhancedAnalysisOutput | null; error: string | null }> {
  if (!article) {
    return { result: null, error: 'Article content is empty.' };
  }
  if (article.length < 100) {
    return {
      result: null,
      error: 'Article must be at least 100 characters long.',
    };
  }
  if (article.length > 10000) {
    return {
      result: null,
      error: 'Article must not exceed 10,000 characters.',
    };
  }

  try {
    const result = await analyzeWithPythonApi(article, userId || undefined);
    return { result, error: null };
  } catch (e) {
    console.error('Error analyzing article:', e);
    return {
      result: null,
      error:
        'Analysis failed. Ensure Flask backend is running at http://localhost:8000 (run: python app.py)',
    };
  }
}

export async function askAboutAnalysis(input: {
  article: string;
  analysis: ClassifyFakeNewsOutput | EnhancedAnalysisOutput;
  question: string;
}): Promise<{ answer: string | null; error: string | null }> {
  try {
    const a = input.analysis as Record<string, unknown>;
    const analysisForApi: Record<string, unknown> =
      'primary_verdict' in a
        ? { ...a }
        : {
            primary_verdict: (a.classification as string)?.replace(/\s/g, '_').toUpperCase() || 'CAUTION_ADVISED',
            classification: a.classification,
            key_findings: a.indicators || [(a.explanation as string)],
            indicators: a.indicators,
            explanation: a.explanation,
            confidence: a.confidence,
          };
    const result = await askFlask({
      article: input.article,
      analysis: analysisForApi,
      question: input.question,
    });
    return { answer: result.answer, error: null };
  } catch (e) {
    console.error('Error in ask flow:', e);
    return {
      answer: null,
      error: 'Unable to answer this follow-up question right now. Please try again in a moment.',
    };
  }
}

export async function fetchNews(
  topic: string
): Promise<{ result: { articles: { headline: string; summary: string; source: string; category: string; url?: string }[] } | null; error: string | null }> {
  if (!topic) {
    return { result: null, error: 'Topic is empty.' };
  }

  try {
    const result = await fetchNewsFromFlask(topic);
    return { result, error: null };
  } catch (e) {
    console.error('Error fetching news:', e);
    return {
      result: null,
      error: 'Failed to fetch news. Ensure Flask backend is running (python app.py).',
    };
  }
}

export async function fetchQuizQuestion(
  topic: string
): Promise<{ result: { text: string; isReal: boolean; explanation?: string; source?: string } | null; error: string | null }> {
  if (!topic) {
    return { result: null, error: 'Topic is empty.' };
  }

  try {
    const result = await fetchQuizFromFlask(topic);
    return { result, error: null };
  } catch (e) {
    console.error('Error fetching quiz question:', e);
    return {
      result: null,
      error: 'Failed to fetch quiz. Ensure Flask backend is running (python app.py).',
    };
  }
}

export async function submitQuizAnswer(data: {
  question: string;
  answer: string;
  correct_answer: string;
  topic: string;
  user_id?: string;
}): Promise<{
  result: {
    correct: boolean;
    points_earned?: number;
    total_points?: number;
    level?: number;
    leveled_up?: boolean;
    accuracy?: number;
    message: string;
  } | null;
  error: string | null;
}> {
  try {
    const result = await submitQuizToFlask(data);
    return { result, error: null };
  } catch (e) {
    console.error('Error submitting quiz answer:', e);
    return {
      result: null,
      error: 'Failed to submit answer. Ensure Flask backend is running.',
    };
  }
}

export async function fetchPredictionHistory(
  page = 1,
  perPage = 20,
  userId?: string,
): Promise<{
  result: { items: PredictionHistoryItem[]; total: number; page: number; totalPages: number } | null;
  error: string | null;
}> {
  try {
    const data = await fetchHistoryFromFlask(page, perPage, userId);
    return {
      result: {
        items: data.items,
        total: data.total,
        page: data.page,
        totalPages: data.total_pages,
      },
      error: null,
    };
  } catch (e) {
    console.error('Error fetching prediction history:', e);
    return {
      result: null,
      error: 'Failed to fetch history. Ensure Flask backend is running (python app.py).',
    };
  }
}
