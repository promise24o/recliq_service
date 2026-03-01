import * as admin from 'firebase-admin';

// Test Firebase connection directly
export async function testFirebaseConnection() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('Firebase already initialized');
      return admin.apps[0];
    }

    // Initialize with service account
    const serviceAccount = {
      projectId: process.env.FCM_PROJECT_ID,
      privateKeyId: process.env.FCM_PRIVATE_KEY_ID,
      privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FCM_CLIENT_EMAIL,
      clientId: process.env.FCM_CLIENT_ID,
      authUri: process.env.FCM_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      tokenUri: process.env.FCM_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      authProviderX509CertUrl: process.env.FCM_AUTH_PROVIDER_X509_CERT_URL,
      clientX509CertUrl: process.env.FCM_CLIENT_X509_CERT_URL,
    };

    console.log('Service account:', {
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
      privateKeyLength: serviceAccount.privateKey?.length,
    });

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.projectId,
    });

    console.log('Firebase initialized successfully');
    return app;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

export async function testDirectSend() {
  try {
    const app = await testFirebaseConnection();
    
    const message = {
      token: 'cc_bZkGnT2qPK_GCHBQp_L:APA91bH7mvD9Hy0EJdumXsO5WXDFLKmcpbQ9Oz2tH7A27CLWLoD8kAf-oTM6QZlBwSWOEDtEZkkNFwxhKr2gXlixmIsyQ098VmIA87iFYzlAdPlfa3lmnnA',
      notification: {
        title: 'Direct Test',
        body: 'Testing direct Firebase send',
      },
      data: { test: 'direct' },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'default',
        },
      },
    };

    console.log('Sending message:', JSON.stringify(message, null, 2));
    
    const response = await admin.messaging(app!).send(message);
    console.log('Direct send successful:', response);
    
    return response;
  } catch (error) {
    console.error('Direct send error:', error);
    return { error: error.message, code: error.code };
  }
}
