"""
ml/sus_score.py
System Usability Scale (SUS) calculator.

Usage:
    from ml.sus_score import sus_score

    responses = [
        [4, 1, 4, 1, 4, 2, 5, 1, 4, 2],  # user 1 (10 items, values 1-5)
        [3, 2, 4, 2, 5, 1, 4, 1, 5, 2],  # user 2
        # ... up to 10 users
    ]
    print(sus_score(responses))  # target >= 68
"""
import numpy as np


def sus_score(responses: list[list[int]]) -> float:
    """
    Compute the SUS score from a list of 10-item SUS questionnaire responses.

    Scoring convention:
      - Odd-numbered items (1,3,5,7,9): scale_value - 1
      - Even-numbered items (2,4,6,8,10): 5 - scale_value
      - Total = (sum of all 10 converted scores) * 2.5  → range [0, 100]

    Args:
        responses: List of lists, each inner list has exactly 10 integers in [1, 5].

    Returns:
        Mean SUS score across all respondents (float, range 0-100).

    Raises:
        ValueError: if any response does not have exactly 10 items.
    """
    scores = []
    for i, r in enumerate(responses):
        if len(r) != 10:
            raise ValueError(f"Response {i} has {len(r)} items; expected 10.")
        if not all(1 <= v <= 5 for v in r):
            raise ValueError(f"Response {i} contains values outside [1, 5].")
        odd_sum  = sum(v - 1 for v in r[0::2])   # items 1,3,5,7,9  (index 0,2,4,6,8)
        even_sum = sum(5 - v for v in r[1::2])   # items 2,4,6,8,10 (index 1,3,5,7,9)
        scores.append((odd_sum + even_sum) * 2.5)
    return float(np.mean(scores))


def interpret_sus(score: float) -> str:
    """Grade the SUS score using the Bangor et al. adjective rating scale."""
    if score >= 85.5:  return "Excellent"
    if score >= 72.6:  return "Good"
    if score >= 52.0:  return "OK"
    if score >= 38.0:  return "Poor"
    return "Awful"


if __name__ == '__main__':
    # Example from the guide
    example_responses = [
        [4, 1, 4, 2, 4, 1, 5, 2, 4, 1],
        [3, 2, 4, 1, 5, 2, 4, 1, 3, 2],
        [5, 1, 5, 1, 4, 2, 5, 1, 4, 2],
        [4, 2, 3, 2, 4, 3, 4, 2, 3, 2],
        [4, 1, 4, 1, 5, 1, 5, 1, 5, 1],
    ]
    s = sus_score(example_responses)
    print(f"SUS Score: {s:.1f} — {interpret_sus(s)}")
    print("Target: >= 68 (marginal acceptability threshold)")
