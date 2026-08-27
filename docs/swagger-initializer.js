// Version list is hand-maintained: add an entry when a new openapi-<version>.yaml
// is added at the repo root. Swagger UI renders these as a dropdown.
window.onload = function() {
  window.ui = SwaggerUIBundle({
    urls: [
      { url: "openapi-1.9.14.json", name: "1.9.14" },
      { url: "openapi-1.9.17.json", name: "1.9.17" }
      
    ],
    "urls.primaryName": "1.9.17",
    dom_id: "#swagger-ui",
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset,
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl,
    ],
    layout: "StandaloneLayout",
  });
};
