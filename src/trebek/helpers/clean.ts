import unidecode from 'unidecode';

export default function clean(text: string): string {
    let cleanText = text;

    // Lower case everything and trim spaces:
    cleanText = cleanText.toLowerCase().trim();
    // Replace double spaces with single spaces:
    cleanText = cleanText.replace(/ {2,}/g, ' ');
    // Strip out punctuation:
    cleanText = cleanText.replace(/['"“”’\-\.,!;:—]/g, '');
    // Ampersands are hard:
    cleanText = cleanText.replace(/&/g, 'and');
    // Convert to ascii:
    cleanText = unidecode(cleanText);

    return cleanText;
}
