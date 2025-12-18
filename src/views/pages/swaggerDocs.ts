export const renderSwaggerDocsPage = (): string => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Solutrix IDP Admin API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({
        url: '/docs.json',
        dom_id: '#swagger-ui',
      });
    </script>
  </body>
</html>`;

