import { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Platform,
  BackHandler,
} from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { CheckoutModalProps, SanwoWebViewMessage } from "./types";

/**
 * Internal modal component that renders the payment provider's checkout
 * inside a full-screen WebView. Messages from the provider flow through
 * `window.ReactNativeWebView.postMessage()` and are parsed here.
 */
export function SanwoCheckoutModal({
  visible,
  html,
  timeout,
  debug,
  providerId,
  onMessage,
  onClose,
  onError,
}: CheckoutModalProps) {
  const [isWebViewLoading, setIsWebViewLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webViewRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const log = useCallback(
    (message: string) => {
      if (debug) {
        console.log(`[Sanwo:RN:${providerId}] ${message}`);
      }
    },
    [debug, providerId],
  );

  // Set up the checkout timeout
  useEffect(() => {
    if (!visible) return;

    timeoutRef.current = setTimeout(() => {
      log(`Checkout timed out after ${timeout}ms`);
      onError(new Error(`Checkout timed out after ${timeout}ms`));
    }, timeout);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [visible, timeout, log, onError]);

  // Handle Android hardware back button
  useEffect(() => {
    if (!visible || Platform.OS !== "android") return;

    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      log("Hardware back button pressed — cancelling checkout");
      onClose();
      return true;
    });

    return () => handler.remove();
  }, [visible, log, onClose]);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const raw = event.nativeEvent.data;
      log(`WebView message: ${raw}`);

      let message: SanwoWebViewMessage;
      try {
        message = JSON.parse(raw) as SanwoWebViewMessage;
      } catch {
        log(`Failed to parse WebView message: ${raw}`);
        return;
      }

      if (message.type !== "sanwo") {
        log(`Ignoring non-Sanwo message: ${raw}`);
        return;
      }

      onMessage(message);
    },
    [log, onMessage],
  );

  const handleWebViewLoadEnd = useCallback(() => {
    setIsWebViewLoading(false);
    log("WebView finished loading");
  }, [log]);

  const handleWebViewError = useCallback(
    (syntheticEvent: { nativeEvent: { description: string } }) => {
      const { description } = syntheticEvent.nativeEvent;
      log(`WebView error: ${description}`);
      onError(new Error(`WebView error: ${description}`));
    },
    [log, onError],
  );

  const handleHttpError = useCallback(
    (syntheticEvent: {
      nativeEvent: { statusCode: number; description: string };
    }) => {
      const { statusCode, description } = syntheticEvent.nativeEvent;
      log(`WebView HTTP error: ${statusCode} ${description}`);
      onError(
        new Error(`WebView HTTP error: ${statusCode} ${description}`),
      );
    },
    [log, onError],
  );

  const handleRenderProcessGone = useCallback(() => {
    log("WebView render process gone");
    onError(new Error("WebView render process terminated unexpectedly"));
  }, [log, onError]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={false}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close checkout"
            accessibilityRole="button"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.webViewContainer}>
          {isWebViewLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#333333" />
            </View>
          )}

          <WebView
            ref={webViewRef}
            source={{ html }}
            style={styles.webView}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            onMessage={handleWebViewMessage}
            onLoadEnd={handleWebViewLoadEnd}
            onError={handleWebViewError}
            onHttpError={handleHttpError}
            onRenderProcessGone={handleRenderProcessGone}
            startInLoadingState={false}
            scalesPageToFit={false}
            mixedContentMode="compatibility"
            allowsInlineMediaPlayback
            cacheEnabled={false}
            incognito
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    zIndex: 1,
  },
});
