from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_ai_feedback(code: str, ast_results: dict) -> str:
    prompt = f"""
You are an expert coding mentor reviewing a student's DSA solution.

Here is their code:
{code}

Static analysis found these issues:
{ast_results}

Please provide:
1. Brief explanation of what the code does
2. Feedback on the issues found
3. Suggestions to improve time/space complexity if applicable
4. Encouragement and one key learning tip

Keep your response concise and beginner-friendly.
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content