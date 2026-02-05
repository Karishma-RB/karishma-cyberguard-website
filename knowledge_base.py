import os
import json
from typing import List, Dict
from quizzes.questions import quizzes

class KnowledgeBase:
    def __init__(self):
        self.documents = []
        self.metadata = []
        
    def load_quiz_data(self):
        """Load all quiz questions and answers as documents"""
        for category, questions in quizzes.items():
            for i, q in enumerate(questions):
                # Create document text
                doc_text = f"""
                Category: {category.replace('_', ' ').title()}
                Question: {q['question']}
                Correct Answer: {q['answer']}
                Options: {', '.join(q['options'])}
                """
                self.documents.append(doc_text)
                self.metadata.append({
                    "source": "quiz",
                    "category": category,
                    "question_id": f"{category}_{i}"
                })
    
    def load_external_docs(self, folder_path="data/documents"):
        """Load additional cybersecurity documents"""
        if not os.path.exists(folder_path):
            return
            
        for filename in os.listdir(folder_path):
            if filename.endswith('.txt'):
                with open(os.path.join(folder_path, filename), 'r') as f:
                    content = f.read()
                    self.documents.append(content)
                    self.metadata.append({
                        "source": "document",
                        "filename": filename
                    })
    
    def get_all_documents(self):
        return self.documents, self.metadata