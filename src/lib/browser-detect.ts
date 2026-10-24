/**
 * In-App Browser (WebView) Detection Utility.
 * 
 * Major social apps (WhatsApp, Instagram, LinkedIn, Telegram, Facebook, etc.)
 * open links inside custom embedded WebViews. Google Identity Services / OAuth
 * strictly blocks sign-in inside WebViews with error:
 * "403: disallowed_useragent".
 * 
 * This utility detects these environments so the app can guide users
 * to open the link in their system browser (Chrome / Safari).
 */

export interface InAppBrowserInfo {
  isInAppBrowser: boolean;
  browserName: string;
  isIOS: boolean;
  isAndroid: boolean;
  systemBrowserRecommendation: "Safari" | "Chrome" | "Browser";
}

export function detectInAppBrowser(): InAppBrowserInfo {
  if (typeof window === "undefined" || !window.navigator) {
    return {
      isInAppBrowser: false,
      browserName: "",
      isIOS: false,
      isAndroid: false,
      systemBrowserRecommendation: "Browser",
    };
  }

  const ua = window.navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const systemBrowserRecommendation = isIOS ? "Safari" : isAndroid ? "Chrome" : "Browser";

  // Check known app tokens
  let browserName = "";
  if (/WhatsApp/i.test(ua)) {
    browserName = "WhatsApp";
  } else if (/Instagram/i.test(ua)) {
    browserName = "Instagram";
  } else if (/FBAN|FBAV/i.test(ua)) {
    browserName = "Facebook";
  } else if (/LinkedInApp/i.test(ua)) {
    browserName = "LinkedIn";
  } else if (/Telegram/i.test(ua)) {
    browserName = "Telegram";
  } else if (/Twitter/i.test(ua)) {
    browserName = "X / Twitter";
  } else if (/Snapchat/i.test(ua)) {
    browserName = "Snapchat";
  } else if (/Line\//i.test(ua)) {
    browserName = "LINE";
  } else if (/MicroMessenger/i.test(ua)) {
    browserName = "WeChat";
  } else if (/musical_ly|ByteLocale|TikTok/i.test(ua)) {
    browserName = "TikTok";
  } else if (isAndroid && /;\s*wv\b/i.test(ua)) {
    // Standard Android WebView flag
    browserName = "In-App Browser";
  } else if (isIOS && !/Safari/i.test(ua) && /AppleWebKit/i.test(ua)) {
    // iOS UIWebView / WKWebView without standalone Safari flag
    browserName = "In-App Browser";
  }

  return {
    isInAppBrowser: Boolean(browserName),
    browserName: browserName || "In-App Browser",
    isIOS,
    isAndroid,
    systemBrowserRecommendation,
  };
}
