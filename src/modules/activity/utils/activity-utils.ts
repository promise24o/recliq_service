import { ActivityAction } from '../infrastructure/persistence/activity-log.model';
import axios from 'axios';

/**
 * Gets a human-readable label for an activity action
 */
export const getActionLabel = (action: ActivityAction): string => {
  const labels: Record<string, string> = {
    login: 'Login',
    logout: 'Logout',
    password_change: 'Password Change',
    two_factor_change: '2FA Change',
    profile_update: 'Profile Update',
    approval: 'Approval',
    rejection: 'Rejection',
    override: 'Override',
    escalation: 'Escalation',
    sensitive_view: 'Sensitive View',
    setting_change: 'Setting Change',
    session_terminated: 'Session Terminated',
    failed_login: 'Failed Login',
    user_action: 'User Action',
    agent_action: 'Agent Action',
    finance_action: 'Finance Action',
    zone_action: 'Zone Action',
    pricing_action: 'Pricing Action',
  };
  return labels[action] || action;
};

/**
 * Extracts device information from user agent string
 */
export const getDeviceInfo = (userAgent: string): string => {
  let device = 'Unknown Device';
  let browser = 'Unknown Browser';
  
  // Device detection
  if (/Macintosh|Mac OS X/i.test(userAgent)) {
    const macMatch = userAgent.match(/Mac OS X ([0-9_]+)/);
    device = macMatch && macMatch[1]
      ? `MacBook (${macMatch[1].replace(/_/g, '.')})` 
      : 'MacBook';
  } else if (/Windows/i.test(userAgent)) {
    const winMatch = userAgent.match(/Windows NT ([0-9.]+)/);
    device = winMatch && winMatch[1]
      ? `Windows ${winMatch[1]}`
      : 'Windows Desktop';
  } else if (/Linux/i.test(userAgent)) {
    device = 'Linux Desktop';
  } else if (/iPhone/i.test(userAgent)) {
    device = 'iPhone';
  } else if (/iPad/i.test(userAgent)) {
    device = 'iPad';
  } else if (/Android/i.test(userAgent)) {
    const androidMatch = userAgent.match(/Android ([0-9.]+)/);
    device = androidMatch && androidMatch[1]
      ? `Android ${androidMatch[1]}`
      : 'Android Device';
  }
  
  // Browser detection
  if (/Chrome/i.test(userAgent) && !/Chromium|Edge/i.test(userAgent)) {
    const chromeMatch = userAgent.match(/Chrome\/([0-9.]+)/);
    browser = chromeMatch && chromeMatch[1]
      ? `Chrome ${chromeMatch[1].split('.')[0]}`
      : 'Chrome';
  } else if (/Firefox/i.test(userAgent)) {
    const ffMatch = userAgent.match(/Firefox\/([0-9.]+)/);
    browser = ffMatch && ffMatch[1]
      ? `Firefox ${ffMatch[1].split('.')[0]}`
      : 'Firefox';
  } else if (/Safari/i.test(userAgent) && !/Chrome|Chromium/i.test(userAgent)) {
    const safariMatch = userAgent.match(/Safari\/([0-9.]+)/);
    browser = safariMatch && safariMatch[1]
      ? `Safari ${safariMatch[1].split('.')[0]}`
      : 'Safari';
  } else if (/Edge/i.test(userAgent)) {
    const edgeMatch = userAgent.match(/Edge\/([0-9.]+)/);
    browser = edgeMatch && edgeMatch[1]
      ? `Edge ${edgeMatch[1].split('.')[0]}`
      : 'Edge';
  } else if (/MSIE|Trident/i.test(userAgent)) {
    browser = 'Internet Explorer';
  }
  
  return `${device} — ${browser}`;
};

/**
 * Gets location information from IP address
 */
export const getLocationFromIp = async (ip: string): Promise<string> => {
  // Skip for localhost or internal IPs
  if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'Local Network';
  }
  
  try {
    // Use a free IP geolocation API (replace with your preferred service)
    // For production, consider using a paid service with better reliability
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);
    const data = response.data;
    
    if (data.error) {
      return 'Unknown Location';
    }
    
    if (data.city && data.country_name) {
      return `${data.city}, ${data.country_name}`;
    } else if (data.country_name) {
      return data.country_name;
    }
    
    return 'Unknown Location';
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return 'Unknown Location';
  }
};
