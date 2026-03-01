import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { getFcmConfig } from './fcm.config';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  image?: string;
  sound?: string;
  badge?: number;
  clickAction?: string;
}

export interface DeviceTarget {
  userId?: string;
  fcmToken?: string;
  deviceType?: 'android' | 'ios';
}

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private fcmApp: admin.app.App;

  constructor() {
    this.initializeFirebase();
  }

  getFirebaseApp(): admin.app.App {
    return this.fcmApp;
  }

  private initializeFirebase() {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length > 0) {
        this.fcmApp = admin.apps[0]!;
        this.logger.log('Firebase app already initialized');
        return;
      }

      // Initialize Firebase with service account
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

      this.fcmApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: serviceAccount.projectId,
      });

      this.logger.log('Firebase app initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase app:', error.message);
      throw error;
    }
  }

  async sendNotification(
    target: DeviceTarget,
    payload: PushNotificationPayload,
  ): Promise<{ success: boolean; failedTokens?: string[]; error?: string }> {
    try {
      let message: admin.messaging.Message;

      if (target.fcmToken) {
        // Send to specific token
        message = {
          token: target.fcmToken,
          notification: {
            title: payload.title,
            body: payload.body,
            imageUrl: payload.image,
          },
          data: payload.data || {},
          android: {
            priority: 'high',
            notification: {
              sound: payload.sound || 'default',
              clickAction: payload.clickAction,
              channelId: 'default',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: payload.sound || 'default',
                badge: payload.badge,
                category: payload.clickAction,
              },
            },
          },
        };
      } else {
        throw new Error('Either fcmToken or userId must be provided');
      }

      this.logger.log(`Sending message: ${JSON.stringify(message, null, 2)}`);
      const response = await admin.messaging(this.fcmApp).send(message);
      this.logger.log(`Notification sent successfully: ${JSON.stringify(response)}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to send notification:', error.message);
      
      // Check if the error is due to invalid token
      if (error.code === 'messaging/registration-token-not-registered' ||
          error.code === 'messaging/invalid-registration-token') {
        return { 
          success: false, 
          failedTokens: target.fcmToken ? [target.fcmToken] : [],
          error: 'Invalid or unregistered token' 
        };
      }

      return { success: false, error: error.message };
    }
  }

  async sendMulticastNotification(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<{ success: boolean; successCount: number; failureCount: number; failedTokens?: string[] }> {
    try {
      if (tokens.length === 0) {
        return { success: true, successCount: 0, failureCount: 0 };
      }

      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.image,
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: payload.sound || 'default',
            clickAction: payload.clickAction,
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: payload.sound || 'default',
              badge: payload.badge,
              category: payload.clickAction,
            },
          },
        },
      };

      // Send to each token individually
      const promises = tokens.map(async (token) => {
        try {
          await admin.messaging(this.fcmApp).send({
            ...message,
            token,
          });
          return { success: true, token };
        } catch (error) {
          return { success: false, token, error };
        }
      });

      const results = await Promise.all(promises);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const failedTokens = results
        .filter(r => !r.success && 
          (r.error?.code === 'messaging/registration-token-not-registered' ||
           r.error?.code === 'messaging/invalid-registration-token'))
        .map(r => r.token);

      this.logger.log(`Multicast notification sent: ${successCount} success, ${failureCount} failed`);

      return {
        success: failureCount === 0,
        successCount,
        failureCount,
        failedTokens,
      };
    } catch (error) {
      this.logger.error('Failed to send multicast notification:', error.message);
      return { success: false, successCount: 0, failureCount: tokens.length };
    }
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<boolean> {
    try {
      const response = await admin.messaging(this.fcmApp).subscribeToTopic(tokens, topic);
      this.logger.log(`Subscribed ${response.successCount} tokens to topic: ${topic}`);
      return response.failureCount === 0;
    } catch (error) {
      this.logger.error('Failed to subscribe to topic:', error.message);
      return false;
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<boolean> {
    try {
      const response = await admin.messaging(this.fcmApp).unsubscribeFromTopic(tokens, topic);
      this.logger.log(`Unsubscribed ${response.successCount} tokens from topic: ${topic}`);
      return response.failureCount === 0;
    } catch (error) {
      this.logger.error('Failed to unsubscribe from topic:', error.message);
      return false;
    }
  }
}
