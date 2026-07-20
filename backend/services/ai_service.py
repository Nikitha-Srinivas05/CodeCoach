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


TITLE_DELIMITER = "---FEEDBACK---"


def get_ai_feedback(code: str, ast_results: dict) -> tuple[str, str]:
    """
    Returns (title, feedback). Asks the model for both in one call so we
    don't pay for a second round-trip just to name the conversation.
    If the model doesn't follow the format, falls back to a generic title
    and treats the whole response as feedback, so nothing breaks either way.
    """
    prompt = f"""
You are an expert coding mentor reviewing a student's DSA solution.

Here is their code:
{code}

Static analysis found these issues:
{ast_results}

Respond in exactly this format:

TITLE: <a short 4-6 word title summarizing what this code/question is about,
no punctuation at the end, e.g. "Two Sum with hash map">
{TITLE_DELIMITER}
1. Brief explanation of what the code does
2. Feedback on the issues found
3. Suggestions to improve time/space complexity if applicable
4. Encouragement and one key learning tip

Keep the feedback concise and beginner-friendly.
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

    raw = response.choices[0].message.content
    return _parse_title_and_feedback(raw)


def _parse_title_and_feedback(raw: str) -> tuple[str, str]:
    if TITLE_DELIMITER in raw:
        title_part, feedback_part = raw.split(TITLE_DELIMITER, 1)
        title_line = title_part.strip()
        if title_line.upper().startswith("TITLE:"):
            title = title_line.split(":", 1)[1].strip().strip('"')
            feedback = feedback_part.strip()
            if title and feedback:
                return title[:60], feedback

    # Model didn't follow the format — don't fail the request over it,
    # just show the raw response and let the caller fall back on its own
    # title logic (e.g. first line of the submitted code).
    return "", raw.strip()
