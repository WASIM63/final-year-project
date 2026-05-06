import requests
from bs4 import BeautifulSoup


def get_product_info(url):
    """Scrape Amazon product page for title and image URL.

    Returns:
        tuple: (title, image_url) — both can be None if scraping fails.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
        "Connection": "Keep-alive",
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)

        print("Scraper Status:", response.status_code)

        # If blocked by Amazon
        if response.status_code != 200:
            return None, None

        soup = BeautifulSoup(response.content, "html.parser")

        # Product title
        title = None
        title_tag = soup.find(id="productTitle")
        if title_tag:
            title = title_tag.get_text(strip=True)

        # Fallback selector
        if not title:
            title_tag = soup.select_one("span#productTitle")
            if title_tag:
                title = title_tag.text.strip()

        # Product Image
        image_url = None
        image_tag = soup.find("img", {"id": "landingImage"})

        if not image_tag:
            image_tag = soup.select_one("img.a-dynamic-image")

        if image_tag:
            image_url = image_tag.get("data-old-hires") or image_tag.get("src")

        return title, image_url

    except Exception as e:
        print("Scraping Error:", e)
        return None, None
