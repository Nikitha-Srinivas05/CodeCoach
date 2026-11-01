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

VALID_TOPICS = [
    "Arrays", "Strings", "Hash Maps", "Linked Lists", "Stacks and Queues",
    "Trees", "Graphs", "Recursion", "Dynamic Programming",
    "Sorting and Searching", "Math", "Other",
]


def get_ai_feedback(code: str, ast_results: dict) -> tuple[str, str, str]:
    """
    Returns (title, topic, feedback). Asks the model for all three in one
    call so we don't pay for extra round-trips. If the model doesn't follow
    the format, falls back to empty title/topic and treats the whole
    response as feedback, so nothing breaks either way.
    """
    topics_list = ", ".join(VALID_TOPICS)
    prompt = f"""
You are an expert coding mentor reviewing a student's DSA solution.

Here is their code:
{code}

Static analysis found these issues:
{ast_results}

Respond in exactly this format:

TITLE: <a short 4-6 word title summarizing what this code/question is about,
no punctuation at the end, e.g. "Two Sum with hash map">
TOPIC: <exactly one of: {topics_list}>
{TITLE_DELIMITER}
1. Brief explanation of what the code does
2. Feedback on the issues found
3. Suggestions to improve time/space complexity if applicable
4. Encouragement and one key learning tip

Keep the feedback concise and beginner-friendly.
"""
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            timeout=30,
        )
    except GroqError as e:
        raise AIServiceError(f"Groq API error: {e}") from e
    except Exception as e:
        raise AIServiceError(f"Unexpected AI service failure: {e}") from e

    if not response.choices:
        raise AIServiceError("AI response contained no choices.")

    raw = response.choices[0].message.content
    return _parse_response(raw)


def _normalize_topic(topic: str) -> str:
    """Map the model's topic onto our fixed list so the dashboard groups cleanly."""
    if not topic:
        return ""
    for valid in VALID_TOPICS:
        if topic.strip().lower() == valid.lower():
            return valid
    return "Other"


def _parse_response(raw: str) -> tuple[str, str, str]:
    if TITLE_DELIMITER in raw:
        header, feedback_part = raw.split(TITLE_DELIMITER, 1)
        title = ""
        topic = ""
        for line in header.splitlines():
            line = line.strip()
            upper = line.upper()
            if upper.startswith("TITLE:"):
                title = line.split(":", 1)[1].strip().strip('"')
            elif upper.startswith("TOPIC:"):
                topic = line.split(":", 1)[1].strip().strip('"')
        feedback = feedback_part.strip()
        if feedback:
            return title[:60], _normalize_topic(topic), feedback

    # Model didn't follow the format: don't fail the request over it.
    return "", "", raw.strip()