from typing import List, Dict, Any
from .vector_store import VectorStore
from .knowledge_base import KnowledgeBase
from .llm_handler import LLMHandler
import json

class CyberGuardRAG:
    def __init__(self, use_local: bool = False):
        self.kb = KnowledgeBase()
        self.vector_store = VectorStore()
        self.llm = LLMHandler()
        self.chat_history = []
        self.max_history = 10
        
        # Load knowledge
        self._initialize_knowledge_base()
    
    def _initialize_knowledge_base(self):
        """Initialize and load all knowledge sources"""
        # Load quiz data
        self.kb.load_quiz_data()
        
        # Load external documents
        self.kb.load_external_docs()
        
        # Get all documents
        documents, metadata = self.kb.get_all_documents()
        
        # Build vector index
        self.vector_store.build_index(documents, metadata)
        
        # Save for future use (optional)
        self.vector_store.save("data/vector_store/cyberguard")
    
    def ask(self, question: str) -> Dict[str, Any]:
        """
        Main method to ask questions
        Returns: {
            "answer": str,
            "sources": list,
            "confidence": float
        }
        """
        # Retrieve relevant documents
        retrieved_docs = self.vector_store.search(question, k=5)
        
        # Generate response using LLM
        answer = self.llm.generate_response(
            query=question,
            context=retrieved_docs,
            chat_history=self.chat_history[-self.max_history:]  # Last N messages
        )
        
        # Update chat history
        self.chat_history.append({"role": "user", "content": question})
        self.chat_history.append({"role": "assistant", "content": answer})
        
        # Keep history manageable
        if len(self.chat_history) > self.max_history * 2:
            self.chat_history = self.chat_history[-self.max_history * 2:]
        
        # Prepare sources
        sources = []
        for doc in retrieved_docs[:3]:  # Top 3 sources
            if doc['metadata'].get('source') == 'quiz':
                sources.append({
                    "type": "quiz",
                    "category": doc['metadata'].get('category', 'Unknown'),
                    "content_preview": doc['content'][:100] + "..."
                })
        
        return {
            "answer": answer,
            "sources": sources,
            "confidence": 0.95 if retrieved_docs else 0.5
        }
    
    def get_relevant_quiz_questions(self, topic: str, limit: int = 3):
        """Get quiz questions relevant to a topic"""
        retrieved_docs = self.vector_store.search(topic, k=10)
        
        quiz_questions = []
        for doc in retrieved_docs:
            if doc['metadata'].get('source') == 'quiz':
                # Parse the document to extract question
                lines = doc['content'].split('\n')
                question_data = {
                    "question": next((l.replace('Question: ', '') for l in lines if l.startswith('Question: ')), ''),
                    "category": doc['metadata'].get('category', 'Unknown')
                }
                if question_data['question']:
                    quiz_questions.append(question_data)
                
                if len(quiz_questions) >= limit:
                    break
        
        return quiz_questions