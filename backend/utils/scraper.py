import re
import requests
from bs4 import BeautifulSoup


# Realistic browser headers to avoid Amazon blocking
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Connection": "Keep-alive",
}


def _fetch_page(url):
    """Fetch and parse an Amazon product page. Returns BeautifulSoup or None."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        print(f"Scraper Status: {response.status_code}")

        if response.status_code != 200:
            return None

        return BeautifulSoup(response.content, "html.parser")

    except Exception as e:
        print(f"Scraping Error: {e}")
        return None


def _extract_title(soup):
    """Extract product title from parsed page."""
    # Primary selector
    tag = soup.find(id="productTitle")
    if tag:
        title = tag.get_text(strip=True)
        if title:
            return title

    # Fallback
    tag = soup.select_one("span#productTitle")
    if tag:
        title = tag.text.strip()
        if title:
            return title

    return None


def _extract_image(soup):
    """Extract product image URL from parsed page."""
    tag = soup.find("img", {"id": "landingImage"})

    if not tag:
        tag = soup.select_one("img.a-dynamic-image")

    if tag:
        return tag.get("data-old-hires") or tag.get("src")

    return None


def _extract_price(soup):
    """Extract current product price from parsed page.

    Tries multiple Amazon price selectors in priority order.
    Returns float price or None.
    """
    price_selectors = [
        # Modern Amazon layout
        "span.a-price span.a-offscreen",
        # Buy box price
        "#price_inside_buybox",
        "#priceblock_ourprice",
        "#priceblock_dealprice",
        "#priceblock_saleprice",
        # Alternative layout
        "#corePrice_feature_div span.a-offscreen",
        "#corePriceDisplay_desktop_feature_div span.a-offscreen",
        # Kindle/digital
        "#kindle-price",
        "#price",
        # Deal price
        ".apexPriceToPay span.a-offscreen",
        "#newBuyBoxPrice",
    ]

    for selector in price_selectors:
        tag = soup.select_one(selector)
        if tag:
            price_text = tag.get_text(strip=True)
            price = _parse_price_text(price_text)
            if price is not None and price > 0:
                return price

    return None


def _extract_list_price(soup):
    """Extract original list price (M.R.P. or Was price).
    Useful to establish pricing upper bounds.
    """
    selectors = [
        "span.a-text-price span.a-offscreen",
        "#listPrice",
        ".basisPrice .a-offscreen",
        "span.basisPrice span.a-offscreen",
    ]

    for selector in selectors:
        tag = soup.select_one(selector)
        if tag:
            price_text = tag.get_text(strip=True)
            price = _parse_price_text(price_text)
            if price is not None and price > 0:
                return price

    return None


def _parse_price_text(text):
    """Parse a price string like '₹1,299.00' or '$29.99' into a float."""
    if not text:
        return None

    # Remove currency symbols and whitespace
    cleaned = re.sub(r"[^\d.,]", "", text.strip())

    # Handle Indian number format (1,29,999.00) and standard (1,299.00)
    cleaned = cleaned.replace(",", "")

    try:
        return float(cleaned)
    except (ValueError, TypeError):
        return None


def get_product_info(url):
    """Scrape Amazon product page for title and image URL.

    Returns:
        tuple: (title, image_url) -- both can be None if scraping fails.
    """
    soup = _fetch_page(url)
    if not soup:
        return None, None

    title = _extract_title(soup)
    image_url = _extract_image(soup)

    return title, image_url


def get_full_product_data(url):
    """Scrape Amazon product page for title, image, current price, AND list price.

    Returns:
        tuple: (title, image_url, current_price, list_price)
    """
    soup = _fetch_page(url)
    if not soup:
        return None, None, None, None

    title = _extract_title(soup)
    image_url = _extract_image(soup)
    current_price = _extract_price(soup)
    list_price = _extract_list_price(soup)

    if current_price:
        print(f"Scraped current price: {current_price} | List: {list_price}")

    return title, image_url, current_price, list_price
