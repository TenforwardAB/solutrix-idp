export type HtmlDocumentOptions = {
    lang?: string;
    title: string;
    head?: string;
    body: string;
};

export const escapeHtml = (value?: string): string => {
    if (!value) {
        return "";
    }
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

export const renderHtmlDocument = (options: HtmlDocumentOptions): string => {
    const { lang = "en", title, head = "", body } = options;
    return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
${head}
<title>${escapeHtml(title)}</title>
</head>
<body>
${body}
</body>
</html>`;
};

