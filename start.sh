if [ -z "$OIDC_COOKIE_KEYS" ]; then
  echo "OIDC_COOKIE_KEYS is required and must contain at least 2 comma-separated 64+ char secrets."
  exit 1
fi

keys_count=$(printf "%s" "$OIDC_COOKIE_KEYS" | awk -F',' '{print NF}')
min_len=$(printf "%s" "$OIDC_COOKIE_KEYS" | awk -F',' '{ok=1; for (i=1;i<=NF;i++) if (length($i) < 64) ok=0; print ok}')

if [ "$keys_count" -lt 2 ] || [ "$min_len" -ne 1 ]; then
  echo "OIDC_COOKIE_KEYS must contain at least 2 comma-separated secrets, each 64+ chars."
  exit 1
fi

echo "Starting app setup..."
npm install
echo "npm install done..."
npm run migrate
echo "migration done"
npm run build 
echo "build done"
npm start
echo "start done"
