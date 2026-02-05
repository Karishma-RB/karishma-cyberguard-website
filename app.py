from flask import Flask, render_template, request, session, jsonify
from flask_session import Session
import random
import os
from dotenv import load_dotenv
from chatbot.rag_system import CyberGuardRAG
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'cyberguard-dev-secret-key-2024')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour

Session(app)

# Initialize RAG Assistant (lazy loading)
rag_assistant = None

def get_assistant():
    """Get or initialize the RAG assistant"""
    global rag_assistant
    if rag_assistant is None:
        rag_assistant = CyberGuardRAG()
    return rag_assistant

# Import quizzes
try:
    from quizzes.questions import quizzes
except ImportError:
    # Fallback if quizzes module isn't available
    quizzes = {
        "network_security": [],
        "cryptography": [],
        "malware": [],
        "web_security": [],
        "cloud_security": [],
        "forensics": []
    }

# Format categories for display
PRETTY_CATEGORIES = {
    "network_security": "Network Security",
    "cryptography": "Cryptography",
    "malware": "Malware Analysis",
    "web_security": "Web Security",
    "cloud_security": "Cloud Security",
    "forensics": "Digital Forensics"
}

@app.route('/')
def home():
    """Home page with category selection"""
    # Initialize user session for quiz tracking
    if 'quiz_scores' not in session:
        session['quiz_scores'] = {}
    
    if 'chat_history' not in session:
        session['chat_history'] = []
    
    return render_template('home.html', 
                          categories=PRETTY_CATEGORIES,
                          user_scores=session.get('quiz_scores', {}))

@app.route('/quiz/<category>', methods=['GET', 'POST'])
def quiz(category):
    """Quiz page for a specific category"""
    if category not in quizzes:
        return render_template('error.html', 
                             error_message="Category not found"), 404
    
    questions = quizzes[category]
    
    if not questions:
        return render_template('error.html',
                             error_message="No questions available for this category"), 404
    
    # Shuffle questions and options for variety
    shuffled_questions = random.sample(questions, min(len(questions), 10))  # Limit to 10 questions
    for q in shuffled_questions:
        random.shuffle(q['options'])
    
    if request.method == 'POST':
        score = 0
        correct_answers = []
        user_answers = []
        
        for i, question in enumerate(shuffled_questions):
            selected_answer = request.form.get(f'question_{i}')
            user_answers.append({
                'question': question['question'],
                'selected': selected_answer,
                'correct': question['answer']
            })
            
            if selected_answer == question['answer']:
                score += 1
                correct_answers.append(True)
            else:
                correct_answers.append(False)
        
        # Store score in session
        if 'quiz_scores' not in session:
            session['quiz_scores'] = {}
        
        session['quiz_scores'][category] = {
            'score': score,
            'total': len(shuffled_questions),
            'percentage': (score / len(shuffled_questions)) * 100,
            'date': datetime.now().isoformat()
        }
        session.modified = True
        
        return render_template('result.html',
                             category=PRETTY_CATEGORIES.get(category, category),
                             score=score,
                             total=len(shuffled_questions),
                             percentage=(score / len(shuffled_questions)) * 100,
                             user_answers=user_answers,
                             correct_answers=correct_answers)
    
    return render_template('quiz.html',
                          category=PRETTY_CATEGORIES.get(category, category),
                          category_key=category,
                          questions=shuffled_questions,
                          total_questions=len(shuffled_questions))

@app.route('/assistant')
def assistant():
    """AI Assistant main page"""
    if 'chat_history' not in session:
        session['chat_history'] = []
    
    # Get suggested topics based on quiz performance
    suggested_topics = []
    quiz_scores = session.get('quiz_scores', {})
    
    for category, score_data in quiz_scores.items():
        if score_data.get('percentage', 0) < 70:  # Suggest topics where score < 70%
            suggested_topics.append(PRETTY_CATEGORIES.get(category, category))
    
    return render_template('assistant.html',
                          chat_history=session['chat_history'],
                          suggested_topics=suggested_topics[:3])

@app.route('/assistant/ask', methods=['POST'])
def ask_assistant():
    """API endpoint for assistant queries"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        question = data.get('question', '').strip()
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        # Get response from RAG assistant
        assistant = get_assistant()
        response = assistant.ask(question)
        
        # Update chat history in session
        if 'chat_history' not in session:
            session['chat_history'] = []
        
        session['chat_history'].append({
            'role': 'user',
            'content': question,
            'timestamp': datetime.now().isoformat()
        })
        
        session['chat_history'].append({
            'role': 'assistant',
            'content': response['answer'],
            'sources': response.get('sources', []),
            'timestamp': datetime.now().isoformat()
        })
        
        # Keep only last 20 messages
        if len(session['chat_history']) > 20:
            session['chat_history'] = session['chat_history'][-20:]
        
        session.modified = True
        
        return jsonify(response)
    
    except Exception as e:
        app.logger.error(f"Error in assistant: {str(e)}")
        return jsonify({
            'answer': 'I encountered an error processing your request. Please try again.',
            'sources': [],
            'confidence': 0.0
        }), 500

@app.route('/assistant/quiz-suggestions', methods=['POST'])
def get_quiz_suggestions():
    """Get quiz suggestions based on topic"""
    try:
        data = request.get_json()
        topic = data.get('topic', '').strip()
        
        if not topic:
            return jsonify({'error': 'Topic is required'}), 400
        
        assistant = get_assistant()
        suggestions = assistant.get_relevant_quiz_questions(topic, limit=3)
        
        # Format suggestions
        formatted_suggestions = []
        for suggestion in suggestions:
            # Find the actual question in quizzes
            for category, questions in quizzes.items():
                for q in questions:
                    if q['question'] == suggestion['question']:
                        formatted_suggestions.append({
                            'question': q['question'],
                            'category': PRETTY_CATEGORIES.get(category, category),
                            'options': q['options'][:3],  # Show only first 3 options
                            'has_more_options': len(q['options']) > 3
                        })
                        break
        
        return jsonify({
            'topic': topic,
            'suggestions': formatted_suggestions
        })
    
    except Exception as e:
        app.logger.error(f"Error suggesting quiz: {str(e)}")
        return jsonify({'error': 'Failed to get suggestions'}), 500

@app.route('/assistant/clear-history', methods=['POST'])
def clear_assistant_history():
    """Clear assistant chat history"""
    session['chat_history'] = []
    session.modified = True
    return jsonify({'success': True, 'message': 'Chat history cleared'})

@app.route('/profile')
def profile():
    """User profile showing quiz scores"""
    quiz_scores = session.get('quiz_scores', {})
    
    # Calculate overall statistics
    total_quizzes = len(quiz_scores)
    total_correct = sum(score.get('score', 0) for score in quiz_scores.values())
    total_questions = sum(score.get('total', 0) for score in quiz_scores.values())
    overall_percentage = (total_correct / total_questions * 100) if total_questions > 0 else 0
    
    # Sort categories by percentage (ascending)
    sorted_categories = sorted(
        quiz_scores.items(),
        key=lambda x: x[1].get('percentage', 0)
    )
    
    return render_template('profile.html',
                          quiz_scores=quiz_scores,
                          pretty_categories=PRETTY_CATEGORIES,
                          total_quizzes=total_quizzes,
                          total_correct=total_correct,
                          total_questions=total_questions,
                          overall_percentage=overall_percentage,
                          sorted_categories=sorted_categories)

@app.route('/api/reset-scores', methods=['POST'])
def reset_scores():
    """Reset all quiz scores"""
    session['quiz_scores'] = {}
    session.modified = True
    return jsonify({'success': True, 'message': 'All scores reset'})

@app.route('/leaderboard')
def leaderboard():
    """Simple leaderboard (in a real app, this would use a database)"""
    # Mock leaderboard data
    leaderboard_data = [
        {'username': 'CyberPro', 'score': 98, 'quizzes_completed': 6},
        {'username': 'SecurityWiz', 'score': 95, 'quizzes_completed': 5},
        {'username': 'CodeGuard', 'score': 92, 'quizzes_completed': 6},
        {'username': 'NetShield', 'score': 88, 'quizzes_completed': 4},
        {'username': 'DataDefender', 'score': 85, 'quizzes_completed': 5},
    ]
    
    # Add current user if they have scores
    user_score = 0
    user_quizzes = 0
    quiz_scores = session.get('quiz_scores', {})
    
    if quiz_scores:
        total_correct = sum(score.get('score', 0) for score in quiz_scores.values())
        total_questions = sum(score.get('total', 0) for score in quiz_scores.values())
        user_score = (total_correct / total_questions * 100) if total_questions > 0 else 0
        user_quizzes = len(quiz_scores)
    
    return render_template('leaderboard.html',
                          leaderboard=leaderboard_data,
                          user_score=user_score,
                          user_quizzes=user_quizzes)

@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error_message="Page not found"), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('error.html', error_message="Internal server error"), 500

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('data/documents', exist_ok=True)
    os.makedirs('data/vector_store', exist_ok=True)
    
    # Run the app
    app.run(host='0.0.0.0', port=5000, debug=True)