echo "Starting app setup..."
npm install
echo "npm install done..."
npm run migrate
echo "migration done"
npm run build 
echo "build done"
npm start
echo "start done"