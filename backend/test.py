from services.ast_analyser import analyse_python

def run_test(name, code, expected_issues=None, expected_complexity=None,
             expected_error_handling=None, expected_recursion=None,
             expect_syntax_error=False):
    print(f"\n{'=' * 55}")
    print(f"TEST: {name}")
    print('=' * 55)
    result = analyse_python(code)

    print(f"Syntax valid:      {result['syntax_valid']}")

    if expect_syntax_error:
        print(f"Syntax error:      {result['syntax_error']}")
        return

    print(f"Complexity:        {result['complexity']}")
    print(f"Error handling:    {result['has_error_handling']}")
    print(f"Recursion:         {result['recursion_found']}")
    print(f"Issues found:      {len(result['all_issues'])}")

    for issue in result['all_issues']:
        print(f"  [{issue['type']}] Line {issue['line']}: {issue['message']}")


# ── Test 1: Nested loop ───────────────────────────────────
run_test("Nested loop — should flag O(n²)", """
def find_duplicate(nums):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] == nums[j]:
                return nums[i]
    return -1
""")

# ── Test 2: Clean code ────────────────────────────────────
run_test("Clean code — should have zero issues", """
def find_max(numbers):
    try:
        if not numbers:
            return None
        max_value = numbers[0]
        for num in numbers:
            if num > max_value:
                max_value = num
        return max_value
    except TypeError:
        return None
""")

# ── Test 3: Recursion ─────────────────────────────────────
run_test("Recursion — should detect O(?)", """
def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)
""")

# ── Test 4: Syntax error ──────────────────────────────────
run_test("Syntax error — should catch broken code", """
def broken(
    for i in range(10)
        print(i
""", expect_syntax_error=True)

# ── Test 5: camelCase function name ───────────────────────
run_test("camelCase — should flag naming", """
def findMax(numbers):
    max_value = numbers[0]
    for num in numbers:
        if num > max_value:
            max_value = num
    return max_value
""")

# ── Test 6: Empty function ────────────────────────────────
run_test("Empty function — should flag missing body", """
def find_max(nums):
    pass
""")

# ── Test 7: Ellipsis placeholder ─────────────────────────
run_test("Ellipsis placeholder — should flag missing body", """
def find_max(nums):
    ...
""")

# ── Test 8: Missing return ────────────────────────────────
run_test("Missing return — should flag compute with no return", """
def find_max(nums):
    max_value = nums[0]
    for num in nums:
        if num > max_value:
            max_value += 1
""")

# ── Test 9: Print function — should NOT flag missing return
run_test("Print only — should NOT flag missing return", """
def display_marks(marks):
    total = 0
    for mark in marks:
        if mark > 35:
            total += 1
    print(total)
""")

# ── Test 10: Triple nested loop ───────────────────────────
run_test("Triple nested loop — should flag O(n³)", """
def multiply_all(matrix):
    result = 0
    for i in matrix:
        for j in i:
            for k in j:
                result += k
    return result
""")

print(f"\n{'=' * 55}")
print("All tests complete.")
print('=' * 55)