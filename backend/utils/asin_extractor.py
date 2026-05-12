import re


def extract_asin(url):
    """Extract Amazon ASIN from a product URL.

    Supports various Amazon URL formats:
    - /dp/B0XXXXXXXXXX
    - /gp/product/B0XXXXXXXXXX
    - /gp/aw/d/B0XXXXXXXXXX (mobile)
    - /product/B0XXXXXXXXXX
    - ASIN in query params (?asin=B0XXXXXXXXXX)
    """
    # Standard patterns (case-insensitive for URL paths)
    patterns = [
        r"/(?:dp|gp/product|gp/aw/d|product)/([A-Z0-9]{10})",
        r"[?&]asin=([A-Z0-9]{10})",
    ]

    for pattern in patterns:
        match = re.search(pattern, url, re.IGNORECASE)
        if match:
            return match.group(1).upper()

    return None
