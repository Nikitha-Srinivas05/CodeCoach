import logging
import os

from dotenv import load_dotenv
from groq import Groq, GroqError

load_dotenv()

logger = logging.getLogger("codecoach")

_api_key = os.getenv("GROQ_API_KEY")
if not _api_key:
    logger.warning(
        "GROQ_API_KEY is not set. AI feedback will fail until it's added to .env"
    )

client = Groq(api_key=_api_key)


class AIServiceError(Exception):
    """Raised when the AI provider fails to return usable feedback."""


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
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            timeout=20,
        )
    except GroqError as e:
        raise AIServiceError(f"Groq API error: {e}") from e
    except Exception as e:
        raise AIServiceError(f"Unexpected AI service failure: {e}") from e

    if not response.choices:
        raise AIServiceError("AI response contained no choices.")

    return response.choices[0].message.content
