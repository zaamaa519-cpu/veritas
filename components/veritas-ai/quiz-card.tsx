'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, X, Check, Repeat, Heart, Timer, Zap, Shield, Target } from 'lucide-react';
import { analyzeArticle, fetchQuizQuestion } from '@/app/actions';
import type { EnhancedAnalysisOutput } from '@/lib/types';
import { enhancedToLegacyFormat } from '@/lib/types';
import { ConfidenceMeter } from './confidence-meter';
import { Badge } from '../ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '../ui/progress';

type GameState = 'mode_selection' | 'topic_selection' | 'playing' | 'loading' | 'result' | 'game_over';
type GameMode = 'Classic' | 'Speed Run' | 'Survival';

type QuizQuestion = {
  text: string;
  isReal: boolean;
};

const quizTopics = [
  'World News',
  'Technology',
  'Business',
  'Science',
  'Health',
  'Entertainment',
];

// Game Constants
const CLASSIC_TOTAL_QUESTIONS = 10;
const CLASSIC_INITIAL_LIVES = 5;
const CLASSIC_TIME_PER_QUESTION = 20;

const SPEED_RUN_DURATION = 120; // 2 minutes

const SURVIVAL_INITIAL_LIVES = 3;
const SURVIVAL_LIFE_GAIN_THRESHOLD = 5;

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  exit: { opacity: 0, y: -20 },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

const gameModesConfig = {
    'Classic': {
        title: 'Classic Challenge',
        description: 'Answer 10 questions with 5 lives. Can you beat the clock?',
        icon: <Target className="w-8 h-8" />
    },
    'Speed Run': {
        title: 'Speed Run',
        description: 'Answer as many questions as you can in 2 minutes.',
        icon: <Zap className="w-8 h-8" />
    },
    'Survival': {
        title: 'Survival Mode',
        description: 'Start with 3 lives. Lose them and you\'re out. Gain lives for streaks.',
        icon: <Shield className="w-8 h-8" />
    }
}

export function QuizCard() {
  const [gameState, setGameState] = useState<GameState>('mode_selection');
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState<'Real' | 'Fake' | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ReturnType<typeof enhancedToLegacyFormat> | null>(null);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [lives, setLives] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);

  const loadNextQuestion = useCallback(async (topic: string) => {
    setGameState('loading');
    setUserAnswer(null);
    setAnalysisResult(null);

    const response = await fetchQuizQuestion(topic);

    if (response.result) {
      setCurrentQuestion(response.result);
      if (gameMode === 'Classic') {
        setTimeLeft(CLASSIC_TIME_PER_QUESTION);
      }
      setGameState('playing');
    } else {
      console.error("Failed to load question");
      setTimeout(() => loadNextQuestion(topic), 1000);
    }
  }, [gameMode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (gameState === 'playing' && timeLeft === 0 && gameMode !== 'Survival') {
      handleAnswer(null);
    }
    return () => clearTimeout(timer);
  }, [gameState, timeLeft, gameMode]);


  const startNewGame = (topic: string) => {
    setSelectedTopic(topic);
    setScore(0);
    setQuestionsAnswered(0);
    setCorrectStreak(0);
    
    if (gameMode === 'Classic') {
        setLives(CLASSIC_INITIAL_LIVES);
    } else if (gameMode === 'Speed Run') {
        setTimeLeft(SPEED_RUN_DURATION);
        setLives(0); // No lives in speed run
    } else if (gameMode === 'Survival') {
        setLives(SURVIVAL_INITIAL_LIVES);
        setTimeLeft(0); // No timer in survival
    }

    loadNextQuestion(topic);
  }

  const resetGame = () => {
    setGameState('mode_selection');
    setGameMode(null);
    setSelectedTopic(null);
  }

  const handleAnswer = async (answer: 'Real' | 'Fake' | null) => {
    if (!currentQuestion || gameState !== 'playing') return;

    setGameState('loading');
    setUserAnswer(answer);

    const isCorrect = answer !== null && ((currentQuestion.isReal && answer === 'Real') || (!currentQuestion.isReal && answer === 'Fake'));

    if (isCorrect) {
      setScore(s => s + 1);
      const newStreak = correctStreak + 1;
      setCorrectStreak(newStreak);
      if (gameMode === 'Survival' && newStreak > 0 && newStreak % SURVIVAL_LIFE_GAIN_THRESHOLD === 0) {
          setLives(l => l + 1);
      }
    } else {
      setLives(l => l > 0 ? l - 1 : 0);
      setCorrectStreak(0);
    }
    
    const textToAnalyze = currentQuestion.text.length >= 100
      ? currentQuestion.text
      : currentQuestion.text + ' [This is a news snippet presented for educational fact-checking practice. Analyze the claims above.]';
    const analysisResponse = await analyzeArticle(textToAnalyze, null);
    setAnalysisResult(analysisResponse.result ? enhancedToLegacyFormat(analysisResponse.result) : null);

    const newQuestionsAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsAnswered);
    
    const isGameOver = (gameMode === 'Classic' && newQuestionsAnswered === CLASSIC_TOTAL_QUESTIONS) ||
                       (gameMode === 'Speed Run' && timeLeft <= 1) || // Time ran out
                       (gameMode === 'Survival' && !isCorrect && lives - 1 <= 0);

    if (isGameOver) {
        setGameState('game_over');
    } else {
        setGameState('result');
    }
  };

  const isGuessCorrect =
    currentQuestion && userAnswer &&
    ((currentQuestion.isReal && userAnswer === 'Real') ||
    (!currentQuestion.isReal && userAnswer === 'Fake'));

  const renderModeSelection = () => (
    <motion.div
      key="mode-selection"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="text-center space-y-6"
    >
        <motion.h2 variants={itemVariants} className="text-2xl font-bold">Choose Your Challenge</motion.h2>
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.keys(gameModesConfig).map((modeKey, i) => {
                const mode = gameModesConfig[modeKey as GameMode];
                return (
                    <motion.div key={modeKey} custom={i} variants={itemVariants}>
                         <Card onClick={() => { setGameMode(modeKey as GameMode); setGameState('topic_selection'); }} className="h-full cursor-pointer hover:border-primary hover:bg-muted/50 transition-all group">
                             <CardHeader className="items-center text-center">
                                 <div className="p-3 rounded-full bg-primary/10 text-primary mb-2 group-hover:scale-110 transition-transform">
                                    {mode.icon}
                                 </div>
                                <CardTitle>{mode.title}</CardTitle>
                             </CardHeader>
                             <CardContent>
                                <p className="text-sm text-muted-foreground">{mode.description}</p>
                             </CardContent>
                         </Card>
                    </motion.div>
                )
            })}
        </motion.div>
    </motion.div>
  )


  const renderTopicSelection = () => (
    <motion.div
      key="topic-selection"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="text-center space-y-6"
    >
        <motion.h2 variants={itemVariants} className="text-2xl font-bold">Choose a Topic</motion.h2>
        <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4">
            {quizTopics.map((topic, i) => (
                <motion.div key={topic} custom={i} variants={itemVariants}>
                    <Button onClick={() => startNewGame(topic)} size="lg" className="shadow-md hover:shadow-lg transition-shadow">
                        {topic}
                    </Button>
                </motion.div>
            ))}
        </motion.div>
        <Button variant="link" onClick={() => setGameState('mode_selection')}>Back to modes</Button>
    </motion.div>
  )

  const renderResult = () => {
    if (!analysisResult || !currentQuestion) return null;

    const aiClassification = analysisResult.classification;
    const aiVerdictText = `Our AI classified this as ${aiClassification}.`;

    const handleNext = () => {
        if(gameMode === 'Speed Run') {
            setTimeLeft(t => Math.max(0, t - 1)); // Decrement time slightly to trigger game over if it's 0
        }
        loadNextQuestion(selectedTopic!);
    }

    return (
      <motion.div
        key="result"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="space-y-6 text-center"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } }}
          className="flex items-center justify-center gap-2"
        >
          {isGuessCorrect ? (
             <Check className="w-10 h-10 text-green-500" />
          ) : (
             <X className="w-10 h-10 text-red-500" />
          )}
          <p className={`text-3xl font-bold ${isGuessCorrect ? 'text-green-500' : 'text-red-500'}`}>
            {isGuessCorrect ? 'Correct!' : (userAnswer === null ? "Time's up!" : 'Incorrect!')}
          </p>
        </motion.div>
        <p className="text-muted-foreground">
          {userAnswer && <>You guessed <span className="font-bold">{userAnswer}</span>. </>}
          The correct answer was <span className="font-bold">{currentQuestion.isReal ? 'Real' : 'Fake'}</span>.
          <br/>
          {aiVerdictText}
        </p>
        <div className="p-4 rounded-lg bg-background/50 border border-border/30 space-y-4">
            <h3 className="font-semibold text-lg">AI Analysis</h3>
            <ConfidenceMeter value={analysisResult.confidence} classification={analysisResult.classification} />
             <p className="text-muted-foreground leading-relaxed text-sm">
                {analysisResult.explanation}
             </p>
            {analysisResult.indicators && analysisResult.indicators.length > 0 && (
                <div className="pt-2">
                    <h4 className="font-semibold text-md">Key Indicators Found:</h4>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {analysisResult.indicators.map((indicator, index) => (
                      <Badge key={index} variant="secondary">{indicator}</Badge>
                    ))}
                    </div>
                </div>
            )}
        </div>
         <Button onClick={handleNext} size="lg">
            Next Question <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    );
  };
  
  const renderQuizEnd = () => (
    <motion.div
        key="game-over"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="space-y-4 text-center"
    >
        <motion.h2 variants={itemVariants} className="text-3xl font-bold">{gameMode === 'Survival' && lives <= 0 ? 'Game Over' : 'Challenge Complete!'}</motion.h2>
        <motion.p variants={itemVariants} className="text-muted-foreground text-lg">
            Your final score is:
        </motion.p>
        <motion.p 
            variants={itemVariants} 
            className="text-7xl font-bold animated-gradient-text bg-gradient-primary-accent bg-clip-text text-transparent py-2"
        >
            {score}
        </motion.p>
        <motion.p variants={itemVariants} className="text-muted-foreground">
            You answered {score} out of {questionsAnswered} questions correctly.
        </motion.p>
        <motion.div variants={itemVariants} className="flex justify-center gap-4 pt-4">
          <Button onClick={resetGame} size="lg">
              Choose New Mode
          </Button>
          <Button onClick={() => setGameState('topic_selection')} variant="outline" size="lg">
              Play Again <Repeat className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
    </motion.div>
  )

  const renderContent = () => {
    switch (gameState) {
        case 'mode_selection':
            return renderModeSelection();
        case 'topic_selection':
            return renderTopicSelection();
        case 'game_over':
            return renderQuizEnd();
        case 'loading':
             return (
                <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-2 text-primary"
                >
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Loading...</p>
                </motion.div>
            )
        case 'result':
            return renderResult();
        case 'playing':
        default:
            if (!currentQuestion) return renderModeSelection(); // Fallback
            return (
                <motion.div
                    key="playing"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="w-full"
                >
                    {gameMode !== 'Survival' && (
                        <motion.div variants={itemVariants}>
                          <div className="w-full bg-muted rounded-full h-2.5 mb-4">
                             <Progress value={(timeLeft / (gameMode === 'Classic' ? CLASSIC_TIME_PER_QUESTION : SPEED_RUN_DURATION)) * 100} className="h-2.5" indicatorClassName="bg-primary" />
                          </div>
                        </motion.div>
                    )}
                    <motion.div variants={itemVariants} className="p-6 rounded-lg bg-muted min-h-[150px] flex items-center justify-center mb-6 border border-border/20">
                        <p className="text-center text-lg text-muted-foreground font-medium">
                            "{currentQuestion?.text}"
                        </p>
                    </motion.div>
                    <motion.div variants={itemVariants} className="flex justify-center gap-4">
                        <Button
                        onClick={() => handleAnswer('Real')}
                        className="w-36 bg-green-600 hover:bg-green-700 text-white shadow-lg transform hover:scale-105 transition-transform"
                        size="lg"
                        >
                        <Check className="mr-2 h-5 w-5" /> Real
                        </Button>
                        <Button
                        onClick={() => handleAnswer('Fake')}
                        className="w-36 bg-red-600 hover:bg-red-700 text-white shadow-lg transform hover:scale-105 transition-transform"
                        size="lg"
                        >
                        <X className="mr-2 h-5 w-5" /> Fake
                        </Button>
                    </motion.div>
                </motion.div>
            )
    }
  }
  
  const renderQuizHeader = () => {
    if (gameState === 'mode_selection' || gameState === 'topic_selection') {
      return <span>{gameState === 'mode_selection' ? 'Select a Mode' : 'Select a Topic'}</span>;
    }
    
    return (
      <div className="flex justify-between items-center w-full text-base sm:text-lg">
        <div className='flex items-center gap-2'>
            <span>{gameMode}</span>
            {gameMode !== 'Speed Run' && <span className="text-muted-foreground text-sm">Q: {questionsAnswered + 1}</span>}
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-primary">
                <span className="font-semibold">{score}</span>
                <Target className="w-5 h-5" />
            </div>
            {gameMode !== 'Survival' && (
                <div className="flex items-center gap-2 text-primary">
                    <Timer className="w-5 h-5" />
                    <span className="font-semibold">{timeLeft}s</span>
                </div>
            )}
            {gameMode !== 'Speed Run' && (
                <div className="flex items-center gap-2 text-red-500">
                    <span className="font-semibold">{lives}</span>
                    <Heart className="w-6 h-6" />
                </div>
            )}
        </div>
      </div>
    );
  };


  return (
    <Card className="w-full border-border/50 glow-shadow-sm transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl flex justify-between items-center">
            {renderQuizHeader()}
        </CardTitle>
        {(gameState === 'playing' || gameState === 'result') && (
            <CardDescription>Topic: {selectedTopic} - Is the following headline real or fake?</CardDescription>
        )}
      </CardHeader>
      <CardContent className="min-h-[450px] flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
            {renderContent()}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
