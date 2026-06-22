from datetime import datetime, timedelta


def calculate_streak(submissions: list) -> int:
    if not submissions:
        return 0

    submission_dates = sorted(
        {s.created_at.date() for s in submissions}, reverse=True
    )

    today = datetime.now().date()
    streak = 0
    expected_date = today

    for date in submission_dates:
        if date == expected_date:
            streak += 1
            expected_date -= timedelta(days=1)
        elif date == expected_date + timedelta(days=1):
            continue
        else:
            break

    return streak