import { google } from 'googleapis';
import http from 'http';
import open from 'open';
import { URL } from 'url';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/userinfo.email',
];

export async function authenticateAccount(label) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3333/callback'
  );

  const url = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log(`\nOpening browser for ${label} account...`);
  await open(url);

  // Spin up a temporary local server to catch the callback
  const tokens = await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const parsed = new URL(req.url, 'http://localhost:3333');
      const code = parsed.searchParams.get('code');
      if (!code) {
        res.end('No code received.');
        return reject(new Error('No code received'));
      }
      res.end('<script>window.close()</script><p>You can close this tab.</p>');
      server.close();
      const { tokens } = await client.getToken(code);
      resolve(tokens);
    });
    server.listen(3333);
    setTimeout(() => { server.close(); reject(new Error('Auth timeout')); }, 120000);
  });

  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data } = await oauth2.userinfo.get();

  return { client, email: data.email, name: data.name };
}
