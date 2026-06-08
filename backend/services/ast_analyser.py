import ast
import re


def analyse_python(code: str) -> dict:
    result = {
        "language": "python",
        "syntax_valid": True,
        "syntax_error": None,
        "loop_depth": 0,
        "complexity": "",
        "complexity_explanation": "",
        "has_error_handling": False,
        "function_count": 0,
        "recursion_found": False,
        "missing_return": [],
        "empty_functions": [],
        "all_issues": [],
        "line_count": len(code.splitlines())
    }

    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        result["syntax_valid"] = False
        result["syntax_error"] = f"Line {e.lineno}: {e.msg}"
        return result

    visitor = _CodeVisitor()
    visitor.visit(tree)

    result["loop_depth"] = visitor.max_loop_depth
    result["has_error_handling"] = visitor.found_try_except
    result["function_count"] = visitor.function_count
    result["recursion_found"] = visitor.found_recursion
    result["missing_return"] = visitor.missing_return
    result["empty_functions"] = visitor.empty_functions
    result["all_issues"] = visitor.all_issues

    result["complexity"], result["complexity_explanation"] = \
        _get_complexity(visitor.max_loop_depth, visitor.found_recursion)

    return result


class _CodeVisitor(ast.NodeVisitor):

    def __init__(self):
        self.max_loop_depth = 0
        self._current_depth = 0
        self.found_try_except = False
        self.function_count = 0
        self.found_recursion = False
        self._current_fn = None
        self.missing_return = []
        self.empty_functions = []
        self.all_issues = []

    def visit_FunctionDef(self, node):
        self.function_count += 1
        previous_fn = self._current_fn
        self._current_fn = node.name

        if not re.match(r'^[a-z_][a-z0-9_]*$', node.name):
            self.all_issues.append({
                "type": "naming",
                "line": node.lineno,
                "message": (
                    f"Function '{node.name}' should use snake_case "
                    f"— Python's official style. "
                    f"Rename to '{_to_snake_case(node.name)}'"
                )
            })

        body = node.body
        is_empty = (
            len(body) == 1 and (
                isinstance(body[0], ast.Pass) or
                (
                    isinstance(body[0], ast.Expr) and
                    isinstance(body[0].value, ast.Constant) and
                    isinstance(body[0].value.value, str)
                ) or
                (
                    isinstance(body[0], ast.Expr) and
                    isinstance(body[0].value, ast.Constant) and
                    body[0].value.value is Ellipsis
                )
            )
        )

        if is_empty:
            issue = {
                "type": "empty",
                "line": node.lineno,
                "message": (
                    f"Function '{node.name}' at line {node.lineno} "
                    f"has no implementation. Did you forget to write the body?"
                )
            }
            self.empty_functions.append(issue)
            self.all_issues.append(issue)

        elif self._function_needs_return(node) and not self._has_return(node):
            issue = {
                "type": "missing_return",
                "line": node.lineno,
                "message": (
                    f"Function '{node.name}' at line {node.lineno} "
                    f"appears to compute a value but does not return one. "
                    f"If the result is intended for use elsewhere, "
                    f"consider returning it."
                )
            }
            self.missing_return.append(issue)
            self.all_issues.append(issue)

        self.generic_visit(node)
        self._current_fn = previous_fn

    visit_AsyncFunctionDef = visit_FunctionDef

    def _has_return(self, func_node) -> bool:
        for node in ast.walk(func_node):
            if isinstance(node, ast.Return) and node.value is not None:
                return True
        return False

    # Conservative heuristic:
    # We intentionally prefer missing some forgotten-return cases
    # over incorrectly flagging valid functions.
    def _function_needs_return(self, func_node) -> bool:
        has_loop = False
        has_augmented_assignment = False
        has_conditional = False

        for node in ast.walk(func_node):
            if isinstance(node, (ast.For, ast.While)):
                has_loop = True
            if isinstance(node, ast.AugAssign):
                has_augmented_assignment = True
            if isinstance(node, ast.If):
                has_conditional = True

        last_stmt = func_node.body[-1]
        if isinstance(last_stmt, ast.Expr) and isinstance(last_stmt.value, ast.Call):
            ends_with_call = True
        else:
            ends_with_call = False

        return (
            has_loop and
            has_augmented_assignment and
            has_conditional and
            not ends_with_call
        )

    def visit_For(self, node):
        self._current_depth += 1
        self.max_loop_depth = max(self.max_loop_depth, self._current_depth)

        if self._current_depth >= 2:
            self.all_issues.append({
                "type": "complexity",
                "line": node.lineno,
                "message": (
                    f"Nested loop detected at line {node.lineno}. "
                    f"This may increase runtime significantly as input size grows. "
                    f"Consider whether alternative data structures or algorithms "
                    f"could improve efficiency."
                )
            })

        self.generic_visit(node)
        self._current_depth -= 1

    def visit_While(self, node):
        self._current_depth += 1
        self.max_loop_depth = max(self.max_loop_depth, self._current_depth)

        if self._current_depth >= 2:
            self.all_issues.append({
                "type": "complexity",
                "line": node.lineno,
                "message": (
                    f"Nested while loop detected at line {node.lineno}. "
                    f"Multiple levels of iteration can impact performance. "
                    f"Review whether the logic can be simplified or reduced."
                )
            })

        self.generic_visit(node)
        self._current_depth -= 1

    def visit_Try(self, node):
        self.found_try_except = True
        self.generic_visit(node)

    def visit_Call(self, node):
        if (self._current_fn is not None and
                isinstance(node.func, ast.Name) and
                node.func.id == self._current_fn):
            self.found_recursion = True
        self.generic_visit(node)


def _get_complexity(loop_depth: int, has_recursion: bool) -> tuple:
    if has_recursion:
        return (
            "Estimated: O(?) — recursion detected",
            "Recursive functions can be O(n), O(log n), or O(2ⁿ) "
            "depending on your base case and number of recursive calls. "
            "Review the recursion tree and number of recursive calls "
            "to estimate the complexity more accurately."
        )

    complexity_map = {
        0: (
            "Estimated: O(1) — constant time ✅",
            "No loops were detected. Runtime appears independent of "
            "explicit iteration, although built-in operations may still "
            "contribute to overall complexity."
        ),
        1: (
            "Estimated: O(n) — linear time ✅",
            "One loop found. Runtime grows proportionally with "
            "input size. Generally acceptable in interviews."
        ),
        2: (
            "Estimated: O(n²) — quadratic time ⚠️",
            "Nested loops were detected. This may become slow for larger inputs. "
            "Consider whether alternative data structures or algorithms "
            "could improve efficiency."
        ),
        3: (
            "Estimated: O(n³) — cubic time ⚠️",
            "Three levels of nested loops were detected. "
            "This may become expensive for larger inputs. "
            "Consider whether parts of the computation can be "
            "restructured or precomputed."
        )
    }

    return complexity_map.get(
        loop_depth,
        (
            f"Estimated: O(n^{loop_depth}) — high complexity ⚠️",
            f"{loop_depth} levels of nested loops were detected. "
            f"This may impact performance as input size grows. "
            f"Review whether the algorithm can be simplified."
        )
    )


def _to_snake_case(name: str) -> str:
    step1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', step1).lower()