'use client';

import { useUser, useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogIn, Award, BarChart3, Star, Edit, User as UserIcon, Check, ChevronDown, Scale, BookCheck, Brain, MessageSquareQuote, Shield } from 'lucide-react';
import { AnimatedCharacter } from '@/components/veritas-ai/animated-character';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { BrainCircuit, SearchCode, Save } from 'lucide-react';


const avatarOptions = [
  { id: 'default', name: 'Default', icon: <UserIcon className="w-10 h-10" /> },
  { id: 'vera', name: 'Holographic Spirit', icon: <AnimatedCharacter className="w-12 h-12" /> },
  { id: 'guardian', name: 'Data Guardian', icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22S19 18 19 12V5L12 2L5 5V12C5 18 12 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 12V12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 15C12.8284 15 13.5 14.3284 13.5 13.5V10.5C13.5 9.67157 12.8284 9 12 9C11.1716 9 10.5 9.67157 10.5 10.5V13.5C10.5 14.3284 11.1716 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )},
    { id: 'scout', name: 'Truth Scout', icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 12C2 12 5 6 12 6C19 6 22 12 22 12C22 12 19 18 12 18C5 18 2 12 2 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 4V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 22V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )},
    { id: 'analyst', name: 'Cyber Analyst', icon: <BrainCircuit className="w-11 h-11" /> },
    { id: 'sleuth', name: 'Info Sleuth', icon: <SearchCode className="w-11 h-11" /> },
];


function ProfileStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-card/50 p-4 border border-border/20 glow-shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function AchievementBadge({
  icon,
  name,
  description,
  unlocked = true,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  unlocked?: boolean;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex flex-col items-center gap-2 text-center transition-all duration-300 ${
              unlocked ? 'opacity-100' : 'opacity-40 grayscale'
            }`}
          >
            <div
              className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 bg-card/80 ${
                unlocked ? 'border-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]' : 'border-border/50'
              }`}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-accent/10"></div>
              <div className="relative text-primary">{icon}</div>
            </div>
            <p className="text-xs font-semibold">{name}</p>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-card/90 backdrop-blur-sm border-primary/20 glow-shadow-sm">
          <p className="font-bold">{name}</p>
          <p className="text-muted-foreground">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const getSkillLevel = (progress: number) => {
    if (progress <= 30) return "Beginner";
    if (progress <= 70) return "Intermediate";
    return "Expert";
}

const levelTitles = [
    { title: 'Truth Seeker', level: 1 },
    { title: 'Fact Checker', level: 4 },
    { title: 'Digital Detective', level: 7 },
    { title: 'Verification Expert', level: 10 },
    { title: 'Credibility Guardian', level: 13 },
    { title: 'Info Sleuth', level: 1 },
    { title: 'Source Sentry', level: 4 },
    { title: 'Misinformation Hunter', level: 7 }
];

function SkillProgressionCard({
    icon,
    skillName,
    description,
    progress,
}: {
    icon: React.ReactNode;
    skillName: string;
    description: string;
    progress: number;
}) {
    const skillLevel = getSkillLevel(progress);
    
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex flex-col gap-3 rounded-lg bg-card/50 p-4 border border-border/20 glow-shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                {icon}
                            </div>
                            <p className="font-semibold">{skillName}</p>
                            <Badge variant="secondary" className="ml-auto">{skillLevel}</Badge>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                </TooltipTrigger>
                <TooltipContent className="bg-card/90 backdrop-blur-sm border-primary/20 glow-shadow-sm max-w-xs">
                    <p className="font-bold">{skillName}</p>
                    <p className="text-muted-foreground">{description}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

function EditProfileDialog({ user, onProfileUpdate }: { user: NonNullable<ReturnType<typeof useUser>['user']>, onProfileUpdate: () => void }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { refreshUser } = useAuth();

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({
        title: 'Error',
        description: 'Name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
        credentials: 'include',
      });

      if (res.ok) {
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been updated successfully.',
        });
        await refreshUser();
        onProfileUpdate();
        setIsOpen(false);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit Profile</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card/90 backdrop-blur-xl border-primary/20 glow-shadow-sm">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Save className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const router = useRouter();
  const [userStats, setUserStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);
  
  const fetchUserStats = async () => {
    if (!user) return;
    setIsLoadingStats(true);
    try {
      const res = await fetch(`http://localhost:8000/api/user/stats/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };
  
  const handleProfileUpdate = () => {
      router.refresh();
      fetchUserStats();
  };

  // Use real stats from backend or fallback to placeholder
  const masteryLevel = userStats?.progress_to_next_level || 75;
  const userLevel = userStats?.level || 8;
  const [userTitle, setUserTitle] = useState('Truth Seeker');
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);

  const skills = [
      { 
        skillName: 'Bias Detection', 
        progress: userStats?.skills?.bias_detection || 65, 
        icon: <Scale className="h-5 w-5"/>, 
        description: 'Measures your ability to identify political, social, or other forms of bias in text.'
      },
      { 
        skillName: 'Source Verification', 
        progress: userStats?.skills?.source_verification || 80, 
        icon: <BookCheck className="h-5 w-5"/>, 
        description: 'Tracks your accuracy in assessing the credibility and reputation of a news source.'
      },
      { 
        skillName: 'Logical Fallacy Spotting', 
        progress: userStats?.skills?.logical_fallacy || 45, 
        icon: <Brain className="h-5 w-5"/>, 
        description: 'Detects how well you recognize common logical fallacies and flawed arguments.'
      },
      { 
        skillName: 'Emotional Language Recognition', 
        progress: userStats?.skills?.emotional_language || 90, 
        icon: <MessageSquareQuote className="h-5 w-5"/>, 
        description: 'Measures your identification of manipulative or emotionally-charged language.'
      },
  ];

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-theme(spacing.14))]">
        <div className="animate-pulse text-primary">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.14))] text-center p-4">
        <AnimatedCharacter className="absolute -top-1/4 -left-1/4 w-1/2 h-auto opacity-10" />
        <AnimatedCharacter className="absolute -bottom-1/4 -right-1/4 w-1/2 h-auto opacity-10" animationDirection="reverse" />
        <h2 className="text-2xl font-bold mb-4">View Your Profile</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Sign in to track your stats, earn badges, and customize your truth-seeking journey.
        </p>
        <Button asChild>
          <Link href="/login">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In to View Profile
          </Link>
        </Button>
      </div>
    );
  }
  
  const handleSelectAvatar = (avatar: typeof avatarOptions[0]) => {
      setSelectedAvatar(avatar);
      setIsAvatarModalOpen(false);
  }

  const handleSelectTitle = (title: string) => {
    setUserTitle(title);
    setIsTitleModalOpen(false);
  }

  const unlockedTitles = levelTitles.filter(t => userLevel >= t.level);

  return (
    <section className="relative w-full overflow-hidden py-16 md:py-24 lg:py-32">
       <div className="container relative px-4 md:px-6">
        <div className="mx-auto grid max-w-5xl gap-12">

          {/* User Header */}
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            <div className="relative">
             <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                <DialogTrigger asChild>
                  <button className="relative group">
                     <Avatar className="h-32 w-32 border-4 border-primary/50 shadow-lg glow-shadow transition-all duration-300 group-hover:border-primary">
                        {selectedAvatar.id === 'default' ? (
                            <>
                                <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                                <AvatarFallback className="text-4xl">
                                {user.displayName
                                    ? user.displayName.charAt(0)
                                    : user.email
                                    ? user.email.charAt(0).toUpperCase()
                                    : '?'}
                                </AvatarFallback>
                            </>
                        ) : (
                           <AvatarFallback className="bg-transparent flex items-center justify-center text-primary">
                             {selectedAvatar.icon}
                           </AvatarFallback>
                        )}
                     </Avatar>
                     <div className="absolute inset-0 bg-background/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit className="h-8 w-8 text-foreground" />
                     </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px] bg-card/90 backdrop-blur-xl border-primary/20 glow-shadow-sm">
                    <DialogHeader>
                        <DialogTitle>Choose Your Avatar</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-4 py-4">
                        {avatarOptions.map((avatar) => (
                           <button
                             key={avatar.id}
                             onClick={() => handleSelectAvatar(avatar)}
                             className={cn(
                               'flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all',
                               selectedAvatar.id === avatar.id ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/50 hover:bg-muted/50'
                             )}
                           >
                             <div className="h-20 w-20 flex items-center justify-center text-primary">{avatar.icon}</div>
                             <p className="font-semibold text-xs text-center">{avatar.name}</p>
                           </button>
                        ))}
                    </div>
                </DialogContent>
             </Dialog>
            </div>
            <div className="space-y-2">
              <Dialog open={isTitleModalOpen} onOpenChange={setIsTitleModalOpen}>
                <DialogTrigger asChild>
                    <Badge className="cursor-pointer group">
                        {userTitle} 
                        <ChevronDown className="h-3 w-3 ml-1 opacity-70 group-hover:opacity-100" />
                    </Badge>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-xl border-primary/20 glow-shadow-sm">
                  <DialogHeader>
                    <DialogTitle>Select Your Title</DialogTitle>
                    <DialogDescription>Choose a title you've unlocked by leveling up.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-2">
                    {levelTitles.map(({ title, level }) => (
                      <button
                        key={title}
                        onClick={() => handleSelectTitle(title)}
                        disabled={userLevel < level}
                        className={cn(
                          "w-full text-left p-3 rounded-md transition-colors flex items-center justify-between",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          ! (userLevel < level) && "hover:bg-primary/10",
                          userTitle === title && "bg-primary/20"
                        )}
                      >
                        <div className="flex flex-col">
                            <span className="font-semibold">{title}</span>
                            {userLevel < level && <span className="text-xs text-muted-foreground">Unlocks at Level {level}</span>}
                        </div>
                        {userTitle === title && <Check className="h-5 w-5 text-primary" />}
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <div className="flex items-center gap-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">{user.displayName || 'Truth Seeker'}</h1>
                <EditProfileDialog user={user} onProfileUpdate={handleProfileUpdate} />
              </div>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
          
          {/* Credibility Mastery */}
           <Card className="border-primary/20 bg-card/80 backdrop-blur-xl glow-shadow-sm">
             <CardHeader>
               <CardTitle className="text-xl">Credibility Mastery</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="space-y-3">
                    <Progress value={masteryLevel} className="h-3" indicatorClassName="bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_hsl(var(--primary)/0.8)]" />
                    <p className="text-sm text-muted-foreground">You are at Level <span className="font-bold text-primary">{userLevel}</span>. Complete more analyses and quizzes to level up!</p>
                </div>
             </CardContent>
           </Card>

          {/* Skills Section */}
           <div>
              <h2 className="text-2xl font-bold mb-6 text-center">Your Skills</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {skills.map(skill => (
                      <SkillProgressionCard key={skill.skillName} {...skill} />
                  ))}
              </div>
           </div>


          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileStatCard 
              icon={<BarChart3 className="h-6 w-6" />} 
              label="Analyses Completed" 
              value={isLoadingStats ? '...' : (userStats?.analyses_completed || 0)} 
            />
            <ProfileStatCard 
              icon={<Star className="h-6 w-6" />} 
              label="Quiz Accuracy" 
              value={isLoadingStats ? '...' : `${userStats?.quiz_accuracy || 0}%`} 
            />
            <ProfileStatCard 
              icon={<Award className="h-6 w-6" />} 
              label="Badges Earned" 
              value={isLoadingStats ? '...' : (userStats?.badges?.length || 0)} 
            />
          </div>

          {/* Badges Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center">Achievements</h2>
            <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-6">
              <AchievementBadge icon={<Award className="w-8 h-8" />} name="Fact-Finder" description="Complete 10 analyses." />
              <AchievementBadge icon={<Star className="w-8 h-8" />} name="Quiz Whiz" description="Score 90% or higher on a quiz." />
              <AchievementBadge icon={<BarChart3 className="w-8 h-8" />} name="Source Sentry" description="Analyze an article from 5 different sources." />
              <AchievementBadge icon={<LogIn className="w-8 h-8" />} name="Truth Scout" description="Complete your first analysis." unlocked={false} />
              <AchievementBadge icon={<Edit className="w-8 h-8" />} name="Profile Pro" description="Customize your profile." unlocked={false} />
              <AchievementBadge icon={<Shield className="w-8 h-8" />} name="Misinfor-mation Hunter" description="Identify 25 fake news articles." unlocked={false} />
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

    