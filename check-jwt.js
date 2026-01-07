const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnaXpla3plZG16ZWtyaWtxanljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTUzNTgsImV4cCI6MjA4MzI5MTM1OH0.ZFUIOdCedS3yr_kOvqwmxpyEYYnrd4Jt5C6NzYJiANU";
const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
console.log(payload);
console.log("Current time:", Math.floor(Date.now() / 1000));
console.log("Expired?", payload.exp < Date.now() / 1000);
