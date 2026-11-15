import { firebaseAuth } from '../src/firebase.js';

const [email, action = 'grant'] = process.argv.slice(2);
if (!email || !['grant', 'revoke'].includes(action)) {
  console.error('Usage: npm run admin -- user@example.com [grant|revoke]');
  process.exit(1);
}
const auth = firebaseAuth();
if (!auth) throw new Error('Configure Firebase Admin credentials in backend/.env first.');
try {
  const user = await auth.getUserByEmail(email);
  const claims = { ...user.customClaims };
  if (action === 'grant') claims.admin = true;
  else delete claims.admin;
  await auth.setCustomUserClaims(user.uid, claims);
  await auth.revokeRefreshTokens(user.uid);
  console.log(`Admin access ${action === 'grant' ? 'granted' : 'revoked'}. The user must sign out and sign in again.`);
} catch (error) {
  console.error('Could not update admin access:', error.code || error.name);
  process.exitCode = 1;
}
