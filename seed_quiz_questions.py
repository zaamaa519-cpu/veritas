#!/usr/bin/env python
"""
Seed quiz questions into MongoDB
Run: python seed_quiz_questions.py
"""

import os
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')
mongo_client = MongoClient(MONGODB_URI)
mongo_db = mongo_client.get_database("veritas_ai")

# Quiz questions data
quiz_questions = [
    # Bias Detection Questions
    {
        'question': 'Scientists Discover Cure for All Cancers!',
        'type': 'true-false',
        'category': 'bias',
        'difficulty': 'beginner',
        'correctAnswer': 'FAKE',
        'explanation': 'Medical breakthroughs take years of rigorous testing. Sensational claims like "cure for ALL cancers" are major red flags. Real medical news uses measured language.',
        'hints': [
            'Look for sensational language',
            'Check if the claim is too good to be true',
            'Real medical breakthroughs are reported cautiously'
        ],
        'tags': ['sensationalism', 'medical', 'bias'],
        'isActive': True,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    },
    {
        'question': 'BREAKING: Aliens Confirmed by Government!!!',
        'type': 'true-false',
        'category': 'bias',
        'difficulty': 'beginner',
        'correctAnswer': 'FAKE',
        'explanation': 'Multiple red flags: ALL CAPS, excessive punctuation (!!!), extraordinary claim without evidence. Real breaking news uses professional formatting.',
        'hints': [
            'Check the formatting - professional news avoids ALL CAPS',
            'Count the exclamation marks',
            'Extraordinary claims require extraordinary evidence'
        ],
        'tags': ['sensationalism', 'formatting', 'extraordinary-claims'],
        'isActive': True,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    },
    {
        'question': 'New Study Shows Mediterranean Diet Linked to Longer Life',
        'type': 'true-false',
        'category': 'source',
        'difficulty': 'beginner',
        'correctAnswer': 'REAL',
        'explanation': 'This headline references a specific study and makes a measured claim. It uses professional language and doesn\'t make absolute promises.',
        'hints': [
            'Look for references to studies',
            'Check for measured language ("linked to" not "guarantees")',
            'Real research is reported carefully'
        ],
        'tags': ['research', 'health', 'credible'],
        'isActive': True,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    },
    
    # Source Verification Questions
    {
        'question': 'Which of these is a reliable fact-checking website?',
        'type': 'multiple-choice',
        'category': 'source',
        'difficulty': 'beginner',
        'options': ['Snopes.com', 'TotallyRealNews.com', 'FactsRUs.net', 'TruthBlog.wordpress.com'],
        'correctAnswer': 'Snopes.com',
        'explanation': 'Snopes.com is a well-established, credible fact-checking organization. Be wary of sites with names that sound too good to be true or use free blogging platforms.',
        'hints': [
            'Look for established organizations',
            'Check the domain - .com from known sources is more reliable than .net or blog platforms',
            'Snopes has been fact-checking since 1994'
        ],
        'tags': ['fact-checking', 'sources', 'verification'],
        'isActive': True,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    },
    {
        'question': 'A news article has no author name listed. This is:',
        'type': 'multiple-choice',
        'category': 'source',
        'difficulty': 'intermediate',
        'options': ['A major red flag', 'Completely normal', 'Only suspicious for opinion pieces', 'Required for anonymous sources'],
        'correctAnswer': 'A major red flag',
        'explanation': 'Credible news articles almost always have author bylines. Anonymous articles make it impossible to verify the writer\'s credentials or hold them accountable.',
        'hints': [
            'Think about accountability',
            'Would you trust information from someone who won\'t identify themselves?',
            'Credible journalists put their names on their work'
        ],
        'tags': ['authorship', 'accountability', 'red-flags'],
        'isActive': True,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    },
    
    # Logical Fallacy Questions
    {
        'question': '"Everyone knows that this politician is corrupt, so it must be true." This is an example of:',
        'type': 'multiple-choice',
        'category': 'fallacy',
        'difficulty': 'intermediate',
        'options': ['Bandwagon fallacy', 'Straw man argument', 'Ad hominem attack', 'False dilemma'],
        'correctAnswer': 'Bandwagon fallacy',
        'explanation': 'The bandwagon fallacy assumes something is true because many people believe it. Truth isn\'t determined by popularity - it requires evidence.',
        'hints': [
            'Look for appeals to popularity',
            '"Everyone knows" is a key phrase',
            'Popular belief doesn\'t equal truth'
        ],
        'tags': ['logical-fallacy', 'bandwagon', 'critical-thinking'],
        'isActive': True,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    },
    {
        'question': '"If we allow this small change, soon everything will collapse!" This reasoning is:',
        'type': 'multiple-choice',
        'category': 'fallacy',
        'difficulty': 'intermediate',
        'options': ['Slippery slope fallacy', 'False equivalence', 'Circular reasoning', 'Red herring'],
        'correctAnswer': 'Slippery slope fallacy',
        'explanation': 'The slippery slope fallacy assumes that one small step will inevitably lead to extreme consequences without providing evidence for this chain of events.',
        'hints': [
            'Look for predictions of extreme outcomes',
            'Check if there\'s evidence for the chain reaction',
            'Small changes don\'t always lead to catastrophe'
        ],
        'tags': ['logical-fallacy', 'slippery-slope', 'reasoning'],
        'isActive': True,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    },
    
    # Emotional Language Questions
    {
        'question': 'An article uses words like "devastating," "shocking," and "outrageous" repeatedly. This suggests:',
        'type': 'multiple-choice',
        'category': 'emotional',
        'difficulty': 'beginner',
        'options': ['Emotional manipulation', 'Objective reporting', 'Expert analysis', 'Balanced coverage'],
        'correctAnswer': 'Emotional manipulation',
        'explanation': 'Excessive emotional language is designed to provoke a reaction rather than inform. Credible news uses more neutral, factual language.',
        'hints': [
            'Count the emotional words',
            'Objective reporting uses neutral language',
            'Manipulation targets your emotions, not your logic'
        ],
        'tags': ['emotional-language', 'manipulation', 'bias'],
        'isActive': True,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    },
    {
        'question': 'A headline says "You Won\'t BELIEVE What Happened Next!" This is:',
        'type': 'true-false',
        'category': 'emotional',
        'difficulty': 'beginner',
        'correctAnswer': 'FAKE',
        'explanation': 'This is classic clickbait designed to manipulate curiosity. Credible news tells you what happened in the headline, not teases you.',
        'hints': [
            'Clickbait creates artificial curiosity',
            'Real news informs, doesn\'t tease',
            'If they won\'t tell you in the headline, be suspicious'
        ],
        'tags': ['clickbait', 'manipulation', 'headlines'],
        'isActive': True,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    },
    
    # Current Affairs (These should be updated regularly)
    {
        'question': 'When verifying a viral social media post, what should you do FIRST?',
        'type': 'multiple-choice',
        'category': 'current-affairs',
        'difficulty': 'intermediate',
        'options': [
            'Check if major news outlets are reporting it',
            'Share it immediately',
            'Assume it\'s true if it has many likes',
            'Only trust it if a celebrity shared it'
        ],
        'correctAnswer': 'Check if major news outlets are reporting it',
        'explanation': 'Before sharing viral content, verify it with credible news sources. Likes and celebrity endorsements don\'t equal truth.',
        'hints': [
            'Verification comes before sharing',
            'Popularity doesn\'t equal accuracy',
            'Check multiple credible sources'
        ],
        'tags': ['social-media', 'verification', 'viral-content'],
        'isActive': True,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    },
    {
        'question': 'A website URL is "cnnews.com.co" instead of "cnn.com". This is:',
        'type': 'multiple-choice',
        'category': 'current-affairs',
        'difficulty': 'intermediate',
        'options': [
            'A fake site mimicking CNN',
            'CNN\'s international site',
            'A legitimate news aggregator',
            'CNN\'s mobile site'
        ],
        'correctAnswer': 'A fake site mimicking CNN',
        'explanation': 'Fake news sites often use URLs that look similar to legitimate sources. Always check the exact URL carefully.',
        'hints': [
            'Look at the domain carefully',
            'Extra words or different extensions are red flags',
            'Legitimate sites don\'t need to mimic others'
        ],
        'tags': ['url-verification', 'fake-sites', 'domain-spoofing'],
        'isActive': True,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    },
    
    # Advanced Questions
    {
        'question': 'An article cites "a recent study" without naming it. You should:',
        'type': 'multiple-choice',
        'category': 'source',
        'difficulty': 'expert',
        'options': [
            'Be skeptical and look for the actual study',
            'Trust it if the site looks professional',
            'Assume it\'s real if other articles mention it',
            'Only question it if you disagree with the conclusion'
        ],
        'correctAnswer': 'Be skeptical and look for the actual study',
        'explanation': 'Vague references to studies are a red flag. Credible articles link to or specifically name their sources so readers can verify claims.',
        'hints': [
            'Vague sourcing is suspicious',
            'Real journalism provides specific citations',
            'You should be able to find and read the study yourself'
        ],
        'tags': ['source-verification', 'studies', 'citations'],
        'isActive': True,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    },
    {
        'question': 'Deepfake videos can be detected by:',
        'type': 'multiple-choice',
        'category': 'current-affairs',
        'difficulty': 'expert',
        'options': [
            'Checking for unnatural blinking, lighting inconsistencies, and audio sync issues',
            'Trusting your gut feeling',
            'Assuming all videos are real unless proven fake',
            'Only questioning videos you disagree with'
        ],
        'correctAnswer': 'Checking for unnatural blinking, lighting inconsistencies, and audio sync issues',
        'explanation': 'Deepfakes often have technical tells like unnatural facial movements, lighting that doesn\'t match, or audio that\'s slightly out of sync.',
        'hints': [
            'Look for technical inconsistencies',
            'Pay attention to lighting and shadows',
            'Watch for unnatural movements'
        ],
        'tags': ['deepfakes', 'video-verification', 'technology'],
        'isActive': True,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    }
]

def seed_questions():
    """Seed quiz questions into MongoDB"""
    try:
        # Clear existing questions (optional - comment out to keep existing)
        # mongo_db.quiz_questions.delete_many({})
        
        # Insert questions
        result = mongo_db.quiz_questions.insert_many(quiz_questions)
        
        print(f"✅ Successfully seeded {len(result.inserted_ids)} quiz questions!")
        print(f"   Database: veritas_ai")
        print(f"   Collection: quiz_questions")
        
        # Print summary
        categories = {}
        difficulties = {}
        for q in quiz_questions:
            cat = q['category']
            diff = q['difficulty']
            categories[cat] = categories.get(cat, 0) + 1
            difficulties[diff] = difficulties.get(diff, 0) + 1
        
        print("\n📊 Questions by Category:")
        for cat, count in categories.items():
            print(f"   {cat}: {count}")
        
        print("\n📊 Questions by Difficulty:")
        for diff, count in difficulties.items():
            print(f"   {diff}: {count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error seeding questions: {str(e)}")
        return False

if __name__ == '__main__':
    print("🌱 Seeding quiz questions...")
    print(f"   MongoDB URI: {MONGODB_URI[:50]}...")
    seed_questions()
