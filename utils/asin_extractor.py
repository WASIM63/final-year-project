import re

def extract_asin(url):
    pattern = r"/(?:dp|gp/product)/([A-Z0-9]{10})"
    match = re.search(pattern, url)
    return match.group(1) if match else None
