import re
from typing import Tuple, List

def parse_media_tags(text: str) -> Tuple[str, List[str], List[str]]:
    """
    Parses [IMAGE: url] and [VIDEO: url] tags from the given text.
    Returns:
        clean_text (str): The text with media tags removed.
        image_urls (List[str]): Extracted image URLs.
        video_urls (List[str]): Extracted video URLs.
    """
    if not text:
        return "", [], []

    # Regex patterns
    image_pattern = r"\[IMAGE:\s*(https?://[^\]]+)\]"
    video_pattern = r"\[VIDEO:\s*(https?://[^\]]+)\]"

    # Extract URLs
    image_urls = re.findall(image_pattern, text, re.IGNORECASE)
    video_urls = re.findall(video_pattern, text, re.IGNORECASE)

    # Remove tags from text
    clean_text = re.sub(image_pattern, "", text, flags=re.IGNORECASE)
    clean_text = re.sub(video_pattern, "", clean_text, flags=re.IGNORECASE)

    # Clean up double newlines or spaces left behind
    clean_text = re.sub(r'\n\s*\n', '\n\n', clean_text).strip()

    return clean_text, list(set(image_urls)), list(set(video_urls))
