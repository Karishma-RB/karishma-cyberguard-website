import os
from typing import List, Dict
import openai
from dotenv import load_dotenv

load_dotenv()

class LLMHandler:
    def __init__(self, model: str = "gpt-3.5-turbo"):
        self.model = model
        self.api_key = os.getenv("OPENAI_API_KEY")
        
        if not self.api_key:
            print("Warning: OPENAI_API_KEY not found. Using fallback responses.")
        
    def generate_response(self, 
                         query: str, 
                         context: List[Dict], 
                         chat_history: List[Dict] = None) -> str:
        """
        Generate response using LLM with RAG context
        """
        # If no API key, use fallback
        if not self.api_key:
            return self._fallback_response(query, context)
        
        openai.api_key = self.api_key
        
        # Build system prompt
        system_prompt = """You are CyberGuard, a cybersecurity assistant. 
        Use the provided context to answer questions accurately.
        If you're not sure based on the context, say so.
        Always provide helpful cybersecurity advice."""
        
        # Build context string
        context_str = "\n\n".join([
            f"Source: {doc.get('metadata', {}).get('source', 'Unknown')}\n"
            f"Content: {doc['content'][:500]}..."  # Truncate for token limits
            for doc in context[:3]  # Use top 3 most relevant
        ])
        
        # Build messages
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Context:\n{context_str}\n\nQuestion: {query}"}
        ]
        
        # Add chat history if provided
        if chat_history:
            messages = chat_history + messages
        
        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error calling OpenAI: {e}")
            return self._fallback_response(query, context)
    
    def _fallback_response(self, query: str, context: List[Dict]) -> str:
        """Fallback when OpenAI API is not available"""
        if context:
            # Return the most relevant document
            return f"Based on available information:\n\n{context[0]['content'][:300]}..."
        else:
            return "I'm currently learning about cybersecurity! For now, please refer to the quiz sections for specific cybersecurity knowledge."

class LocalLLMHandler:
    """Alternative using local models (requires additional setup)"""
    def __init__(self):
        # You can integrate with Ollama, Llama.cpp, etc.
        pass