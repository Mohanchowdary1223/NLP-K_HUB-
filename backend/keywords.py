# Define keywords for each category
keywords = {
    'Canteen': ['food', 'lunch', 'snack', 'meal', 'canteen', 'dinner', 'breakfast', 'cuisine', 'dish', 'restaurant',
                'menu', 'eating', 'order', 'takeaway', 'serve', 'delicious', 'taste', 'cook',
                'chef', 'recipe', 'appetizer', 'main course', 'dessert', 'refreshments', 'buffet', 
                'drinks', 'beverages', 'snacks', 'treat', 'special', 'gourmet'],
    
    'Class': ['class', 'lecture', 'study', 'exam', 'syllabus', 'course', 'subject', 'teacher', 'pupil',
              'homework', 'assignment', 'grades', 'curriculum', 'session', 'seminar', 'tutorial', 
              'training', 'education', 'learning', 'knowledge', 'classroom', 'students', 'test', 
              'quiz', 'project', 'presentation', 'feedback', 'evaluation', 'participation', 'attendance',
              'peer', 'workshop'],

    'Fear': ['anxiety', 'nervous', 'fear', 'stress', 'panic', 'worry', 'apprehension', 'fright', 
             'dread', 'terror', 'unease', 'phobia', 'tension', 'distress', 'foreboding', 
             'alarm', 'disquiet', 'agitation', 'fret', 'concern', 'trepidation', 'shock', 
             'timidity', 'horror', 'fears', 'trouble', 'despair', 'anguish', 'turbulence'],

    'Food': ['food', 'dish', 'cuisine', 'dinner', 'breakfast', 'lunch', 'snack', 'meal', 'recipe',
             'ingredient', 'cooking', 'baking', 'grill', 'stew', 'soup', 'salad', 'appetizer', 
             'dessert', 'beverage', 'sauce', 'taste', 'flavor', 'dish', 'cater', 'feast', 
             'vegetarian', 'vegan', 'spicy', 'sweet', 'sour', 'bitter', 'savory'],

    'Funny': ['joke', 'funny', 'humor', 'laugh', 'comedy', 'giggle', 'hilarity', 'witty', 
              'amusement', 'entertainment', 'satire', 'puns', 'sketch', 'parody', 'gag', 
              'banter', 'prank', 'chuckle', 'jest', 'silly', 'laughter', 'smile', 
              'wit', 'punchline', 'stand-up', 'humorist', 'mock', 'light-hearted', 'comic', 'mirth'],

    'Hackathons': ['hackathon', 'coding', 'programming', 'development', 'innovation', 'project', 
                   'collaboration', 'competition', 'teamwork', 'solution', 'challenge', 'creativity', 
                   'design', 'technology', 'software', 'app', 'prototype', 'ideas', 'brainstorm', 
                   'coding', 'sprint', 'workshop', 'presentations', 'networking', 'mentorship', 
                   'debugging', 'iteration', 'community', 'resources', 'support'],

    'Hostel': ['hostel', 'room', 'dormitory', 'bed', 'sleep', 'accommodation', 'student housing', 
               'community', 'shared', 'living', 'facilities', 'kitchen', 'study room', 'laundry', 
               'common area', 'security', 'privacy', 'rules', 'guests', 'check-in', 'check-out', 
               'maintenance', 'caretaker', 'roommate', 'environment', 'housing', 'flatmates', 
               'dorm', 'stay', 'locality'],

    'Lessons': ['lesson', 'learning', 'teaching', 'knowledge', 'education', 'lecture', 
                'course', 'topic', 'material', 'study', 'skill', 'practice', 'method', 
                'curriculum', 'experience', 'strategy', 'session', 'development', 
                'coaching', 'training', 'tutoring', 'study group', 'assignment', 
                'resources', 'expertise', 'instructor', 'guide', 'knowledge-sharing'],

    'Motivation': ['motivation', 'goal', 'inspiration', 'dream', 'drive', 'ambition', 
                   'determination', 'passion', 'success', 'aspiration', 'hope', 
                   'encouragement', 'support', 'positivity', 'enthusiasm', 'challenge', 
                   'achievement', 'persistence', 'resilience', 'focus', 'commitment', 
                   'self-improvement', 'energy', 'mindset', 'creativity', 'vision', 
                   'growth', 'opportunity', 'resolve', 'action', 'dedication'],

    'Student': ['student', 'pupil', 'learner', 'classmate', 'school', 'scholar', 
                'enrollment', 'study', 'education', 'participant', 'research', 
                'academic', 'coursework', 'degree', 'graduate', 'undergraduate', 
                'homework', 'study group', 'team', 'peer', 'classroom', 
                'project', 'feedback', 'performance', 'report', 'assessment', 
                'attendance', 'presentation', 'evaluation', 'mentor', 'adviser'],

    'Student Club': ['club', 'activity', 'event', 'group', 'community', 'membership', 
                     'participation', 'project', 'collaboration', 'teamwork', 
                     'meeting', 'social', 'networking', 'initiative', 'leadership', 
                     'interest', 'volunteer', 'development', 'forum', 'workshop', 
                     'program', 'engagement', 'challenge', 'involvement', 'experience', 
                     'skills', 'projects', 'discussion', 'outreach', 'support', 'fun'],

    'Teacher': ['teacher', 'professor', 'mentor', 'instructor', 'guide', 'educator', 
                'lecturer', 'trainer', 'facilitator', 'tutor', 'coach', 'staff', 
                'class', 'curriculum', 'education', 'knowledge', 'feedback', 
                'support', 'assessment', 'evaluation', 'experience', 'expert', 
                'role model', 'influence', 'advice', 'learning', 'development', 
                'research', 'community', 'engagement', 'inspiration'],

    'Transport': ['bus', 'car', 'bike', 'train', 'transport', 'travel', 'journey', 
                  'commute', 'vehicle', 'route', 'ticket', 'station', 'departure', 
                  'arrival', 'schedule', 'fare', 'destination', 'logistics', 
                  'public transport', 'taxi', 'shuttle', 'ride', 'transportation', 
                  'carpool', 'aviation', 'ship', 'freight', 'cargo', 'delivery', 
                  'infrastructure', 'accessibility'],

    'Empowerment': ['empowerment', 'strength', 'support', 'enable', 'capacity', 'confidence', 
                    'growth', 'development', 'advancement', 'skill', 'training', 'resources', 
                    'knowledge', 'agency', 'leadership', 'advocacy', 'self-efficacy'],

    'Employment': ['employment', 'job', 'work', 'career', 'profession', 'occupation', 
                   'hiring', 'resume', 'interview', 'salary', 'benefits', 'position', 
                   'full-time', 'part-time', 'unemployment', 'workforce', 'skills', 
                   'training', 'experience', 'opportunity']
}