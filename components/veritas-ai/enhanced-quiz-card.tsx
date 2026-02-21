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
import { Loader2, ArrowRight, X, Check, Repeat, Heart, Timer, Zap, Shield, Target, Trophy, TrendingUp, Sparkles } from 'lucide-react';
import { analyzeArticle, fetchQuizQuestion, submitQuizAnswer } from '@/app/actions';
import type { EnhancedAnalysisOutput } from '@/lib/types';
import { enhancedToLegacyFormat } from '@/lib/types';
import { ConfidenceMeter } from './confidence-meter';
import { Badge } from '../ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '../ui/progress';
import { useUser } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

type ConfettiFunction = (options?: any) => void;

type GameState = 'mode_selection' | 'topic_selection' | 'playing' | 'loading' | 'result' | 'game_over';
type GameMode = 'Classic' | 'Speed Run' | 'Survival';

type QuizQuestion = {
  text: string;
  isReal: boolean;
  explanation?: string;
  source?: string;
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
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const gameModesConfig = {
    'Classic': {
        title: 'Classic Challenge',
        description: 'Answer 10 questions with 5 lives. Test your skills!',
        icon: <Target className="w-8 h-8" />,
        color: 'from-blue-500 to-cyan-500'
    },
    'Speed Run': {
        title: 'Speed Run',
        description: 'Answer as many as you can in 2 minutes!',
        icon: <Zap className="w-8 h-8" />,
        color: 'from-yellow-500 to-orange-500'
    },
    'Survival': {
        title: 'Survival Mode',
        description: '3 lives. Lose them and game over. Streaks earn lives!',
        icon: <Shield className="w-8 h-8" />,
        color: 'from-purple-500 to-pink-500'
    }
}

export function EnhancedQuizCard() {
  const { user } = useUser();
  const { toast } = useToast();
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
  const [userLevel, setUserLevel] = useState(1);
  const [userPoints, setUserPoints] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiFunction | null>(null);

  // Load confetti dynamically
  useEffect(() => {
    import('canvas-confetti').then((module) => {
      setConfetti(() => module.default);
    });
  }, []);

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
      toast({
        title: 'Error loading question',
        description: response.error || 'Please try again',
        variant: 'destructive',
      });
      setTimeout(() => loadNextQuestion(topic), 1000);
    }
  }, [gameMode, toast]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (gameState === 'playing' && timeLeft === 0 && gameMode !== 'Survival') {
      handleAnswer(null);
    }
    return () => clearTimeout(timer);
  }, [gameState, timeLeft, gameMode]);

  const fireConfetti = () => {
    if (confetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const startNewGame = (topic: string) => {
    setSelectedTopic(topic);
    setScore(0);
    setQuestionsAnswered(0);
    setCorrectStreak(0);
    
    if (gameMode === 'Classic') {
        setLives(CLASSIC_INITIAL_LIVES);
    } else if (gameMode === 'Speed Run') {
        setTimeLeft(SPEED_RUN_DURATION);
        setLives(0);
    } else if (gameMode === 'Survival') {
        setLives(SURVIVAL_INITIAL_LIVES);
        setTimeLeft(0);
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
          toast({
            title: '❤️ Extra Life!',
            description: `${SURVIVAL_LIFE_GAIN_THRESHOLD} correct in a row!`,
          });
      }
    } else {
      setLives(l => l > 0 ? l - 1 : 0);
      setCorrectStreak(0);
    }
    
    // Submit answer to backend
    if (user) {
      const submitResponse = await submitQuizAnswer({
        question: currentQuestion.text,
        answer: answer || 'TIMEOUT',
        correct_answer: currentQuestion.isReal ? 'REAL' : 'FAKE',
        topic: selectedTopic || 'general',
        user_id: user.id,
      });

      if (submitResponse.result) {
        if (submitResponse.result.leveled_up) {
          setShowLevelUp(true);
          setUserLevel(submitResponse.result.level || 1);
          fireConfetti();
          toast({
            title: '🎉 Level Up!',
            description: `You reached level ${submitResponse.result.level}!`,
          });
          setTimeout(() => setShowLevelUp(false), 3000);
        }
        if (submitResponse.result.total_points !== undefined) {
          setUserPoints(submitResponse.result.total_points);
        }
        if (submitResponse.result.level !== undefined) {
          setUserLevel(submitResponse.result.level);
        }
      }
    }
    
    const textToAnalyze = currentQuestion.text.length >= 100
      ? currentQuestion.text
      : currentQuestion.text + ' [This is a news snippet presented for educational fact-checking practice. Analyze the claims above.]';
    const analysisResponse = await analyzeArticle(textToAnalyze, null);
    setAnalysisResult(analysisResponse.result ? enhancedToLegacyFormat(analysisResponse.result) : null);

    const newQuestionsAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsAnswered);
    
    const isGameOver = (gameMode === 'Classic' && newQuestionsAnswered === CLASSIC_TOTAL_QUESTIONS) ||
                       (gameMode === 'Speed Run' && timeLeft <= 1) ||
                       (gameMode === 'Survival' && !isCorrect && lives - 1 <= 0);

    if (isGameOver) {
        setGameState('game_over');
        if (score >= (newQuestionsAnswered * 0.8)) {
          fireConfetti();
        }
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
        <motion.div variants={itemVariants} className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Choose Your Challenge
          </h2>
          {user && (
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>Level {userLevel}</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>{userPoints} points</span>
              </div>
            </div>
          )}
        </motion.div>
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.keys(gameModesConfig).map((modeKey, i) => {
                const mode = gameModesConfig[modeKey as GameMode];
                return (
                    <motion.div 
                      key={modeKey} 
                      custom={i} 
                      variants={itemVariants}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                         <Card 
                           onClick={() => { setGameMode(modeKey as GameMode); setGameState('topic_selection'); }} 
                           className="h-full cursor-pointer hover:border-primary hover:shadow-lg transition-all group relative overflow-hidden"
                         >
                             <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                             <CardHeader className="items-center text-center relative z-10">
                                 <motion.div 
                                   className="p-3 rounded-full bg-primary/10 text-primary mb-2"
                                   whileHover={{ rotate: 360 }}
                                   transition={{ duration: 0.5 }}
                                 >
                                    {mode.icon}
                                 </motion.div>
                                <CardTitle className="text-xl">{mode.title}</CardTitle>
                             </CardHeader>
                             <CardContent className="relative z-10">
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
        <motion.h2 variants={itemVariants} className="text-2xl font-bold">
          Choose a Topic
        </motion.h2>
        <motion.p variants={itemVariants} className="text-muted-foreground">
          Questions will be based on current news from this category
        </motion.p>
        <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-3">
            {quizTopics.map((topic, i) => (
                <motion.div 
                  key={topic} 
                  custom={i} 
                  variants={itemVariants}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                    <Button 
                      onClick={() => startNewGame(topic)} 
                      size="lg" 
                      className="shadow-md hover:shadow-xl transition-all"
                    >
                        {topic}
                    </Button>
                </motion.div>
            ))}
        </motion.div>
        <Button variant="link" onClick={() => setGameState('mode_selection')}>
          ← Back to modes
        </Button>
    </motion.div>
  )

  const renderResult = () => {
    if (!analysisResult || !currentQuestion) return null;

    const aiClassification = analysisResult.classification;
    const aiVerdictText = `Our AI classified this as ${aiClassification}.`;

    const handleNext = () => {
        if(gameMode === 'Speed Run') {
            setTimeLeft(t => Math.max(0, t - 1));
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
          className="flex flex-col items-center justify-center gap-3"
        >
          <motion.div
            animate={{ rotate: isGuessCorrect ? [0, -10, 10, -10, 10, 0] : [0, -5, 5, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          >
            {isGuessCorrect ? (
               <div className="p-4 rounded-full bg-green-500/20">
                 <Check className="w-12 h-12 text-green-500" />
               </div>
            ) : (
               <div className="p-4 rounded-full bg-red-500/20">
                 <X className="w-12 h-12 text-red-500" />
               </div>
            )}
          </motion.div>
          <p className={`text-3xl font-bold ${isGuessCorrect ? 'text-green-500' : 'text-red-500'}`}>
            {isGuessCorrect ? 'Correct!' : (userAnswer === null ? "Time's up!" : 'Incorrect!')}
          </p>
          {isGuessCorrect && correctStreak > 1 && (
            <Badge className="animate-pulse">
              🔥 {correctStreak} streak!
            </Badge>
          )}
        </motion.div>
        
        <div className="space-y-2">
          <p className="text-muted-foreground">
            {userAnswer && <>You guessed <span className="font-bold">{userAnswer}</span>. </>}
            The correct answer was <span className="font-bold">{currentQuestion.isReal ? 'Real' : 'Fake'}</span>.
          </p>
          {currentQuestion.source && (
            <p className="text-sm text-muted-foreground">
              Source: <span className="font-semibold">{currentQuestion.source}</span>
            </p>
          )}
        </div>

        <div className="p-4 rounded-lg bg-background/50 border border-border/30 space-y-4">
            <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5" />
              AI Analysis
            </h3>
            <ConfidenceMeter value={analysisResult.confidence} classification={analysisResult.classification} />
             <p className="text-muted-foreground leading-relaxed text-sm">
                {currentQuestion.explanation || analysisResult.explanation}
             </p>
            {analysisResult.indicators && analysisResult.indicators.length > 0 && (
                <div className="pt-2">
                    <h4 className="font-semibold text-sm mb-2">Key Indicators:</h4>
                    <div className="flex flex-wrap justify-center gap-2">
                    {analysisResult.indicators.map((indicator, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">{indicator}</Badge>
                    ))}
                    </div>
                </div>
            )}
        </div>
         <Button onClick={handleNext} size="lg" className="w-full">
            Next Question <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    );
  };
  
  const renderQuizEnd = () => {
    const accuracy = questionsAnswered > 0 ? Math.round((score / questionsAnswered) * 100) : 0;
    const performanceMessage = accuracy >= 80 ? 'Excellent!' : accuracy >= 60 ? 'Good job!' : 'Keep practicing!';
    
    return (
      <motion.div
          key="game-over"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-6 text-center"
      >
          <motion.h2 variants={itemVariants} className="text-3xl font-bold">
            {gameMode === 'Survival' && lives <= 0 ? 'Game Over' : 'Challenge Complete!'}
          </motion.h2>
          <motion.div variants={itemVariants} className="space-y-2">
            <p className="text-muted-foreground text-lg">{performanceMessage}</p>
            <motion.p 
                variants={itemVariants} 
                className="text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent py-2"
                animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity }}
            >
                {score}/{questionsAnswered}
            </motion.p>
            <p className="text-2xl font-semibold text-muted-foreground">
              {accuracy}% Accuracy
            </p>
            {user && (
              <div className="flex items-center justify-center gap-4 pt-2">
                <Badge variant="outline" className="text-base py-1 px-3">
                  <Trophy className="w-4 h-4 mr-1" />
                  Level {userLevel}
                </Badge>
                <Badge variant="outline" className="text-base py-1 px-3">
                  <Sparkles className="w-4 h-4 mr-1" />
                  {userPoints} points
                </Badge>
              </div>
            )}
          </motion.div>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <Button onClick={resetGame} size="lg" variant="outline">
                Choose New Mode
            </Button>
            <Button onClick={() => setGameState('topic_selection')} size="lg">
                Play Again <Repeat className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
      </motion.div>
    )
  }

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
                    className="flex flex-col items-center justify-center gap-3 text-primary py-12"
                >
                    <Loader2 className="h-12 w-12 animate-spin" />
                    <p className="text-lg">Loading question from current news...</p>
                </motion.div>
            )
        case 'result':
            return renderResult();
        case 'playing':
        default:
            if (!currentQuestion) return renderModeSelection();
            return (
                <motion.div
                    key="playing"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="w-full space-y-6"
                >
                    {gameMode !== 'Survival' && (
                        <motion.div variants={itemVariants}>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Time Remaining</span>
                              <span className={timeLeft <= 5 ? 'text-red-500 font-bold' : ''}>{timeLeft}s</span>
                            </div>
                            <Progress 
                              value={(timeLeft / (gameMode === 'Classic' ? CLASSIC_TIME_PER_QUESTION : SPEED_RUN_DURATION)) * 100} 
                              className="h-3" 
                              indicatorClassName={timeLeft <= 5 ? 'bg-red-500' : 'bg-primary'}
                            />
                          </div>
                        </motion.div>
                    )}
                    <motion.div 
                      variants={itemVariants} 
                      className="p-6 rounded-lg bg-gradient-to-br from-muted/50 to-muted min-h-[180px] flex items-center justify-center border-2 border-border/20 shadow-lg"
                      whileHover={{ scale: 1.02 }}
                    >
                        <p className="text-center text-lg font-medium leading-relaxed">
                            "{currentQuestion?.text}"
                        </p>
                    </motion.div>
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => handleAnswer('Real')}
                            className="w-full sm:w-40 h-14 bg-green-600 hover:bg-green-700 text-white shadow-lg text-lg font-semibold"
                            size="lg"
                          >
                            <Check className="mr-2 h-6 w-6" /> Real
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => handleAnswer('Fake')}
                            className="w-full sm:w-40 h-14 bg-red-600 hover:bg-red-700 text-white shadow-lg text-lg font-semibold"
                            size="lg"
                          >
                            <X className="mr-2 h-6 w-6" /> Fake
                          </Button>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )
    }
  }
  
  const renderQuizHeader = () => {
    if (gameState === 'mode_selection' || gameState === 'topic_selection') {
      return (
        <div className="flex items-center justify-between w-full">
          <span className="text-xl font-bold">Fake News Challenge</span>
          {user && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">
                <Trophy className="w-3 h-3 mr-1" />
                Lv.{userLevel}
              </Badge>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="flex justify-between items-center w-full text-base">
        <div className='flex items-center gap-3'>
            <Badge variant="outline" className="font-semibold">{gameMode}</Badge>
            {gameMode !== 'Speed Run' && (
              <span className="text-muted-foreground text-sm">
                Question {questionsAnswered + 1}
                {gameMode === 'Classic' && `/${CLASSIC_TOTAL_QUESTIONS}`}
              </span>
            )}
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 text-primary font-semibold">
                <Target className="w-5 h-5" />
                <span>{score}</span>
            </div>
            {gameMode !== 'Survival' && (
                <div className="flex items-center gap-1.5 text-primary font-semibold">
                    <Timer className="w-5 h-5" />
                    <span>{timeLeft}s</span>
                </div>
            )}
            {gameMode !== 'Speed Run' && (
                <div className="flex items-center gap-1.5 text-red-500 font-semibold">
                    <Heart className="w-5 h-5" fill="currentColor" />
                    <span>{lives}</span>
                </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center">
              <Trophy className="w-16 h-16 mx-auto mb-2" />
              <h2 className="text-4xl font-bold">LEVEL UP!</h2>
              <p className="text-2xl">Level {userLevel}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Card className="w-full border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-xl flex justify-between items-center">
              {renderQuizHeader()}
          </CardTitle>
          {(gameState === 'playing' || gameState === 'result') && (
              <CardDescription className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{selectedTopic}</Badge>
                <span className="text-xs">Based on current news headlines</span>
              </CardDescription>
          )}
        </CardHeader>
        <CardContent className="min-h-[500px] flex items-center justify-center p-6">
          <AnimatePresence mode="wait">
              {renderContent()}
          </AnimatePresence>
        </CardContent>
      </Card>
    </>
  );
}
