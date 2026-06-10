from services.ai_service import get_ai_feedback

code = """
def find_max(arr):
    max_val = arr[0]
    for i in range(len(arr)):
        for j in range(len(arr)):
            if arr[i] > max_val:
                max_val = arr[i]
    return max_val
"""

ast_results = {
    "loop_complexity": "O(n²) - nested loops detected",
    "issues": []
}

feedback = get_ai_feedback(code, ast_results)
print(feedback)