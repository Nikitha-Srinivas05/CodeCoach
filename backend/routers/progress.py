import json
from collections import Counter, defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from services.habit_tracker import calculate_streak
from database import get_db
from models import Conversation, Submission, Message, User
from dependencies import get_current_user

router = APIRouter()


@router.get("/conversations")
def get_conversations(
    limit: int = Query(20, ge=1, le=100, description="Max conversations to return"),
    offset: int = Query(0, ge=0, description="Number of conversations to skip"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base_query = db.query(Conversation).filter(Conversation.user_id == current_user.id)

    # total_count lets the sidebar show "showing 20 of 143" and know when
    # to stop offering a "load more" button, without a second round trip.
    total_count = base_query.count()

    conversations = (
        base_query
        .order_by(Conversation.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "items": [
            {"id": c.id, "title": c.title, "created_at": c.created_at}
            for c in conversations
        ],
        "total_count": total_count,
        "limit": limit,
        "offset": offset,
    }


@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return [
        {"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at}
        for m in messages
    ]


@router.get("/progress/streak")
def get_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submissions = (
        db.query(Submission)
        .join(Message, Submission.message_id == Message.id)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Submission.created_at.desc())
        .all()
    )

    return {
        "current_streak": calculate_streak(submissions),
        "total_submissions": len(submissions),
    }


@router.get("/progress/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_conversations = (
        db.query(Conversation).filter(Conversation.user_id == current_user.id).count()
    )
    total_submissions = (
        db.query(Submission)
        .join(Message, Submission.message_id == Message.id)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(Conversation.user_id == current_user.id)
        .count()
    )

    return {
        "total_conversations": total_conversations,
        "total_submissions": total_submissions,
    }

@router.get("/progress/issues-breakdown")
def get_issues_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submissions = (
        db.query(Submission)
        .join(Message, Submission.message_id == Message.id)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(Conversation.user_id == current_user.id)
        .all()
    )

    counts = Counter()
    for s in submissions:
        if not s.ast_results:
            continue
        try:
            parsed = json.loads(s.ast_results)
        except (json.JSONDecodeError, TypeError):
            continue

        for issue in parsed.get("all_issues", []):
            issue_type = issue.get("type", "unknown")
            counts[issue_type] += 1

    return {
        "breakdown": [
            {"type": issue_type, "count": count}
            for issue_type, count in counts.most_common()
        ],
        "total_issues": sum(counts.values()),
    }


@router.get("/progress/activity")
def get_activity(
    days: int = Query(30, ge=1, le=365, description="Number of days to include"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cutoff = datetime.utcnow() - timedelta(days=days)

    submissions = (
        db.query(Submission)
        .join(Message, Submission.message_id == Message.id)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(
            Conversation.user_id == current_user.id,
            Submission.created_at >= cutoff,
        )
        .all()
    )

    counts_by_day = defaultdict(int)
    for s in submissions:
        day_key = s.created_at.date().isoformat()
        counts_by_day[day_key] += 1

    today = datetime.utcnow().date()
    activity = []
    for i in range(days):
        day = today - timedelta(days=(days - 1 - i))
        day_key = day.isoformat()
        activity.append({"date": day_key, "count": counts_by_day.get(day_key, 0)})

    return {"activity": activity, "days": days}

def _load_user_submissions(db: Session, user: User) -> list:
    return (
        db.query(Submission)
        .join(Message, Submission.message_id == Message.id)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(Conversation.user_id == user.id)
        .all()
    )


def _parse_issues(submission: Submission) -> list:
    """Return the list of AST issues for a submission, or [] if missing/corrupt."""
    if not submission.ast_results:
        return []
    try:
        parsed = json.loads(submission.ast_results)
    except (json.JSONDecodeError, TypeError):
        return []
    return parsed.get("all_issues", [])


@router.get("/progress/topics-breakdown")
def get_topics_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Per DSA topic: how many submissions, how many static-analysis issues,
    and the average issues per submission. The topic with the highest
    average is the user's weakest area.
    """
    submissions = _load_user_submissions(db, current_user)

    stats = defaultdict(lambda: {"submissions": 0, "issues": 0})
    untagged = 0

    for s in submissions:
        if not s.topic:
            untagged += 1
            continue
        stats[s.topic]["submissions"] += 1
        stats[s.topic]["issues"] += len(_parse_issues(s))

    breakdown = [
        {
            "topic": topic,
            "submissions": data["submissions"],
            "issues": data["issues"],
            "avg_issues": round(data["issues"] / data["submissions"], 2),
        }
        for topic, data in stats.items()
    ]
    breakdown.sort(key=lambda row: row["submissions"], reverse=True)

    return {"breakdown": breakdown, "untagged": untagged}


@router.get("/progress/trends")
def get_trends(
    weeks: int = Query(8, ge=1, le=52, description="Number of weeks to include"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Weekly submissions and issues, oldest week first, so the frontend can
    show whether mistakes are going up or down over time. Weeks start on
    Monday. Weeks with no activity are included with zeros.
    """
    today = datetime.utcnow().date()
    this_monday = today - timedelta(days=today.weekday())
    first_monday = this_monday - timedelta(weeks=weeks - 1)

    weekly = {}
    for i in range(weeks):
        week_start = first_monday + timedelta(weeks=i)
        weekly[week_start] = {"submissions": 0, "issues": 0, "by_type": Counter()}

    for s in _load_user_submissions(db, current_user):
        day = s.created_at.date()
        if day < first_monday:
            continue
        week_start = day - timedelta(days=day.weekday())
        if week_start not in weekly:
            continue
        issues = _parse_issues(s)
        weekly[week_start]["submissions"] += 1
        weekly[week_start]["issues"] += len(issues)
        for issue in issues:
            weekly[week_start]["by_type"][issue.get("type", "unknown")] += 1

    return {
        "weeks": [
            {
                "week_start": week_start.isoformat(),
                "submissions": data["submissions"],
                "issues": data["issues"],
                "by_type": dict(data["by_type"]),
            }
            for week_start, data in weekly.items()
        ]
    }