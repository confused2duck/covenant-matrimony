# PHP demonstration

`seed.json` contains 12 fictional starting profiles and mock workspace records. It is used to initialize the PHP demonstration; the static website uses `dist/data.mjs`.

From the repository root, with PHP 8.2 or newer:

```bash
php -S 127.0.0.1:8080 server/router.php
```

Open http://127.0.0.1:8080. Demo credentials and walkthroughs are in the root README.md.

The API stores shared demo state in `var/demo.json`, outside the public `dist` directory. Set `COVENANT_DATA_DIR` to use another private, writable directory. To reset the demonstration, stop the server and delete that generated store.

The included Vercel configuration serves the static mock-data website. Running this PHP backend requires a PHP host.
