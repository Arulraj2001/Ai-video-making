from app.middleware.rate_limit import SlidingWindowLimiter


def test_sliding_window_rejects_burst_and_returns_retry_after():
    limiter = SlidingWindowLimiter(limit=2, window_seconds=60)

    assert limiter.allow("user")[0] is True
    assert limiter.allow("user")[0] is True
    allowed, retry_after = limiter.allow("user")

    assert allowed is False
    assert retry_after > 0


def test_sliding_window_isolates_keys():
    limiter = SlidingWindowLimiter(limit=1, window_seconds=60)

    assert limiter.allow("first")[0] is True
    assert limiter.allow("second")[0] is True
    assert limiter.allow("first")[0] is False
