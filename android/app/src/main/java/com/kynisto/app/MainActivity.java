package com.kynisto.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DownloadManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.Settings;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.content.FileProvider;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 301;
    private static final int LOCATION_REQUEST = 302;
    private static final int STORAGE_REQUEST = 303;
    private static final long BACK_EXIT_WINDOW_MS = 2_000L;
    private static final String APP_HOST = "kynisto.in";

    public static boolean isTrustedHost(String host) {
        if (host == null) return false;
        String h = host.toLowerCase(Locale.ROOT);
        return h.equals("kynisto.in")
            || h.equals("www.kynisto.in")
            || h.endsWith(".kynisto.in")
            || h.equals("kynisto.nxt-arshit.workers.dev")
            || h.endsWith(".workers.dev");
    }

    private String defaultUserAgent;
    private String customUserAgent;
    private WebView webView;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progress;
    private View offlineView;
    private View loadingView;
    private ValueCallback<Uri[]> fileCallback;
    private Uri cameraOutput;
    private GeolocationPermissions.Callback geolocationCallback;
    private String geolocationOrigin;
    private PendingDownload pendingDownload;
    private long lastBackPressedAt;
    private ConnectivityManager.NetworkCallback networkCallback;
    private String lastHandledAppLink;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        webView = findViewById(R.id.web_view);
        swipeRefresh = findViewById(R.id.swipe_refresh);
        progress = findViewById(R.id.loading_progress);
        offlineView = findViewById(R.id.offline_view);
        loadingView = findViewById(R.id.loading_view);
        Button retry = findViewById(R.id.retry_button);

        configureWebView();
        swipeRefresh.setColorSchemeResources(R.color.kynisto_blue, R.color.kynisto_cyan);
        swipeRefresh.setOnChildScrollUpCallback((parent, child) -> webView.getScrollY() > 0);
        swipeRefresh.setOnRefreshListener(() -> {
            if (isOnline()) webView.reload();
            else showOffline();
        });
        retry.setOnClickListener(view -> reconnect());
        registerConnectivity();

        Uri launchUri = getIntent() == null ? null : getIntent().getData();
        if (handleNotificationIntent(getIntent())) {
            // Handled notification deep link target URL
        } else if (isTrustedAppLink(launchUri)) {
            loadAppLink(launchUri);
        } else if (savedInstanceState != null && webView.restoreState(savedInstanceState) != null) {
            loadingView.setVisibility(View.GONE);
        } else if (isOnline()) {
            webView.loadUrl(BuildConfig.WEB_URL);
        } else {
            showOffline();
        }
    }

    private boolean handleNotificationIntent(Intent intent) {
        if (intent == null) return false;
        String targetUrl = intent.getStringExtra("target_url");
        if (targetUrl != null && !targetUrl.trim().isEmpty()) {
            String url = targetUrl.trim();
            if (url.startsWith("/")) {
                webView.loadUrl(BuildConfig.WEB_URL + url);
                return true;
            } else if (url.startsWith("http://") || url.startsWith("https://")) {
                webView.loadUrl(url);
                return true;
            }
        }
        return false;
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setLoadsImagesAutomatically(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        
        defaultUserAgent = "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36";
        customUserAgent = defaultUserAgent;
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setOffscreenPreRaster(true);
        }

        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        webView.setBackgroundColor(Color.rgb(244, 247, 252));
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidNotification");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleNavigation(request.getUrl());
            }

            @Override
            public void onReceivedSslError(WebView view, android.webkit.SslErrorHandler handler, android.net.http.SslError error) {
                String failingUrl = error != null ? error.getUrl() : "";
                Uri uri = (failingUrl != null && !failingUrl.isEmpty()) ? Uri.parse(failingUrl) : null;
                String host = uri != null ? uri.getHost() : null;
                if (host != null && isTrustedHost(host)) {
                    handler.proceed();
                } else {
                    handler.cancel();
                    showOffline();
                }
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                progress.setVisibility(View.VISIBLE);
                offlineView.setVisibility(View.GONE);
                view.getSettings().setUserAgentString(defaultUserAgent);
            }

            @Override
            public void onPageCommitVisible(WebView view, String url) {
                loadingView.animate().alpha(0f).setDuration(160).withEndAction(() -> {
                    loadingView.setVisibility(View.GONE);
                    loadingView.setAlpha(1f);
                }).start();
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                CookieManager.getInstance().flush();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request != null && request.isForMainFrame()) showOffline();
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                showOffline();
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
                progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                openFileChooser(params);
                return true;
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                Uri uri = Uri.parse(origin);
                if (!"https".equalsIgnoreCase(uri.getScheme()) || !isTrustedHost(uri.getHost())) {
                    callback.invoke(origin, false, false);
                    return;
                }
                if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                    callback.invoke(origin, true, true);
                } else {
                    geolocationOrigin = origin;
                    geolocationCallback = callback;
                    requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, LOCATION_REQUEST);
                }
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) ->
            beginDownload(new PendingDownload(url, userAgent, contentDisposition, mimeType))
        );
    }

    private boolean handleNavigation(Uri uri) {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        
        if (isTrustedAppLink(uri)) return false;
        
        if (isOAuthUrl(uri)) {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            try {
                intent.setPackage("com.android.chrome");
                startActivity(intent);
            } catch (ActivityNotFoundException e) {
                intent.setPackage(null);
                openExternal(intent);
            }
            return true;
        }

        if ("about".equals(scheme)) return false;
        if ("tel".equals(scheme) || "mailto".equals(scheme) || "sms".equals(scheme)
            || "geo".equals(scheme) || "market".equals(scheme)) {
            return openExternal(new Intent(Intent.ACTION_VIEW, uri));
        }
        if ("intent".equals(scheme)) {
            try {
                Intent intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
                return openExternal(intent);
            } catch (Exception ignored) {
                Toast.makeText(this, "This link is not supported.", Toast.LENGTH_SHORT).show();
                return true;
            }
        }
        if ("https".equals(scheme)) {
            return false;
        }
        return true;
    }

    private boolean isOAuthUrl(Uri uri) {
        if (uri == null) return false;
        String host = uri.getHost();
        String fullUrl = uri.toString().toLowerCase(Locale.ROOT);
        if (host == null) return false;
        String lowerHost = host.toLowerCase(Locale.ROOT);
        String path = uri.getPath() == null ? "" : uri.getPath().toLowerCase(Locale.ROOT);

        return lowerHost.equals("accounts.google.com")
            || (lowerHost.equals("google.com") && path.contains("/o/oauth2"))
            || (lowerHost.endsWith("supabase.co") && path.contains("/auth"))
            || lowerHost.endsWith("supabase.net")
            || lowerHost.contains("accounts.google")
            || lowerHost.contains("googleusercontent.com")
            || lowerHost.contains("googleapis.com")
            || fullUrl.contains("access_token")
            || fullUrl.contains("code=");
    }

    private boolean isTrustedAppLink(Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
        if ("kynisto".equals(scheme)) return true;
        return "https".equalsIgnoreCase(scheme) && isTrustedHost(host);
    }

    private void loadAppLink(Uri uri) {
        if (!isTrustedAppLink(uri)) return;
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        String target = uri.toString();
        if ("kynisto".equals(scheme)) {
            String path = uri.getPath() == null ? "" : uri.getPath();
            String host = uri.getHost() == null ? "" : uri.getHost();
            String query = uri.getQuery() == null ? "" : "?" + uri.getQuery();
            String fragment = uri.getFragment() == null ? "" : "#" + uri.getFragment();
            target = BuildConfig.WEB_URL + "/" + host + path + query + fragment;
        }
        String current = webView.getUrl();
        if (target.equals(lastHandledAppLink) || target.equals(current)) return;

        lastHandledAppLink = target;
        offlineView.setVisibility(View.GONE);
        loadingView.setAlpha(1f);
        loadingView.setVisibility(View.VISIBLE);
        webView.stopLoading();
        webView.loadUrl(target);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (handleNotificationIntent(intent)) {
            // Target URL deep link handled
        } else {
            Uri returnUri = intent == null ? null : intent.getData();
            if (isTrustedAppLink(returnUri)) {
                loadAppLink(returnUri);
            }
        }
    }

    private boolean openExternal(Intent intent) {
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, "No compatible app is installed.", Toast.LENGTH_SHORT).show();
        }
        return true;
    }

    private void openFileChooser(WebChromeClient.FileChooserParams params) {
        Intent files = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        files.addCategory(Intent.CATEGORY_OPENABLE);
        files.setType("*/*");
        files.putExtra(Intent.EXTRA_MIME_TYPES, acceptedTypes(params));
        files.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE);

        List<Intent> cameraIntents = new ArrayList<>();
        String[] accepts = acceptedTypes(params);
        boolean imageAccepted = containsType(accepts, "image/");
        boolean videoAccepted = containsType(accepts, "video/");
        try {
            File directory = new File(getCacheDir(), "camera");
            if (!directory.exists() && !directory.mkdirs()) throw new IOException("Camera directory unavailable");
            if (imageAccepted || (!imageAccepted && !videoAccepted)) {
                File image = File.createTempFile("kynisto-", ".jpg", directory);
                cameraOutput = FileProvider.getUriForFile(this, getPackageName() + ".files", image);
                Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                camera.putExtra(MediaStore.EXTRA_OUTPUT, cameraOutput);
                camera.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                if (camera.resolveActivity(getPackageManager()) != null) cameraIntents.add(camera);
            }
            if (videoAccepted) {
                File video = File.createTempFile("kynisto-", ".mp4", directory);
                Uri videoOutput = FileProvider.getUriForFile(this, getPackageName() + ".files", video);
                Intent recorder = new Intent(MediaStore.ACTION_VIDEO_CAPTURE);
                recorder.putExtra(MediaStore.EXTRA_OUTPUT, videoOutput);
                recorder.putExtra(MediaStore.EXTRA_DURATION_LIMIT, 120);
                recorder.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                if (recorder.resolveActivity(getPackageManager()) != null) {
                    cameraIntents.add(recorder);
                    if (params.isCaptureEnabled() || !imageAccepted) cameraOutput = videoOutput;
                }
            }
        } catch (IOException ignored) {
            cameraOutput = null;
        }

        Intent chooser = Intent.createChooser(files, "Choose Kynisto media");
        chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, cameraIntents.toArray(new Intent[0]));
        try {
            startActivityForResult(chooser, FILE_CHOOSER_REQUEST);
        } catch (ActivityNotFoundException error) {
            fileCallback.onReceiveValue(null);
            fileCallback = null;
            Toast.makeText(this, "No file or camera app is available.", Toast.LENGTH_SHORT).show();
        }
    }

    private String[] acceptedTypes(WebChromeClient.FileChooserParams params) {
        ArrayList<String> result = new ArrayList<>();
        for (String value : params.getAcceptTypes()) {
            if (value == null || value.isBlank()) continue;
            for (String type : value.split(",")) if (!type.isBlank()) result.add(type.trim());
        }
        if (result.isEmpty()) {
            result.add("image/*");
            result.add("video/*");
        }
        return result.toArray(new String[0]);
    }

    private boolean containsType(String[] types, String prefix) {
        for (String type : types) if (type.startsWith(prefix) || "*/*".equals(type)) return true;
        return false;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || fileCallback == null) return;
        Uri[] results = null;
        if (resultCode == RESULT_OK) {
            if (data == null || (data.getData() == null && data.getClipData() == null)) {
                if (cameraOutput != null) results = new Uri[]{cameraOutput};
            } else if (data.getClipData() != null) {
                ClipData clip = data.getClipData();
                results = new Uri[clip.getItemCount()];
                for (int index = 0; index < clip.getItemCount(); index++) results[index] = clip.getItemAt(index).getUri();
            } else if (data.getData() != null) {
                results = new Uri[]{data.getData()};
            }
        }
        fileCallback.onReceiveValue(results);
        fileCallback = null;
        cameraOutput = null;
    }

    private void beginDownload(PendingDownload download) {
        Uri uri = Uri.parse(download.url);
        if (!"https".equalsIgnoreCase(uri.getScheme())) {
            Toast.makeText(this, "Only secure downloads are allowed.", Toast.LENGTH_SHORT).show();
            return;
        }
        pendingDownload = download;
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P
            && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, STORAGE_REQUEST);
            return;
        }
        enqueueDownload(download);
    }

    private void enqueueDownload(PendingDownload download) {
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(download.url));
            request.setMimeType(download.mimeType);
            request.addRequestHeader("User-Agent", download.userAgent);
            String cookie = CookieManager.getInstance().getCookie(download.url);
            if (cookie != null) request.addRequestHeader("Cookie", cookie);
            String filename = URLUtil.guessFileName(download.url, download.contentDisposition, download.mimeType);
            request.setTitle(filename);
            request.setDescription("Kynisto download");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
            ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(request);
            Toast.makeText(this, "Download started.", Toast.LENGTH_SHORT).show();
        } catch (Exception error) {
            openExternal(new Intent(Intent.ACTION_VIEW, Uri.parse(download.url)));
        } finally {
            pendingDownload = null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == LOCATION_REQUEST && geolocationCallback != null) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            geolocationCallback.invoke(geolocationOrigin, granted, granted);
            geolocationCallback = null;
            geolocationOrigin = null;
            if (!granted && !shouldShowRequestPermissionRationale(Manifest.permission.ACCESS_FINE_LOCATION)) {
                Toast.makeText(this, "Location can be enabled later in Android settings.", Toast.LENGTH_LONG).show();
            }
        } else if (requestCode == STORAGE_REQUEST && pendingDownload != null) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) enqueueDownload(pendingDownload);
            else {
                Toast.makeText(this, "Storage permission is required for downloads on this Android version.", Toast.LENGTH_LONG).show();
                pendingDownload = null;
            }
        }
    }

    private void registerConnectivity() {
        ConnectivityManager manager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(@NonNull Network network) {
                runOnUiThread(() -> {
                    if (offlineView.getVisibility() == View.VISIBLE) reconnect();
                });
            }
            @Override
            public void onLost(@NonNull Network network) {
                if (!isOnline()) runOnUiThread(() -> swipeRefresh.setRefreshing(false));
            }
        };
        manager.registerDefaultNetworkCallback(networkCallback);
    }

    private boolean isOnline() {
        ConnectivityManager manager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (manager == null) return true;
        Network network = manager.getActiveNetwork();
        if (network == null) return false;
        NetworkCapabilities capabilities = manager.getNetworkCapabilities(network);
        if (capabilities == null) return false;
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    private void reconnect() {
        if (!isOnline()) {
            showOffline();
            return;
        }
        offlineView.setVisibility(View.GONE);
        loadingView.setVisibility(View.VISIBLE);
        String current = webView.getUrl();
        if (current != null && current.startsWith("https://") && !current.equals("about:blank")) {
            webView.reload();
        } else {
            webView.loadUrl(BuildConfig.WEB_URL);
        }
    }

    private void showOffline() {
        progress.setVisibility(View.GONE);
        swipeRefresh.setRefreshing(false);
        loadingView.setVisibility(View.GONE);
        offlineView.setVisibility(View.VISIBLE);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
            return;
        }
        long now = System.currentTimeMillis();
        if (now - lastBackPressedAt < BACK_EXIT_WINDOW_MS) {
            super.onBackPressed();
        } else {
            lastBackPressedAt = now;
            Toast.makeText(this, "Press back again to close Kynisto.", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        if (networkCallback != null) {
            try {
                ((ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE)).unregisterNetworkCallback(networkCallback);
            } catch (Exception ignored) {}
        }
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        webView.stopLoading();
        webView.setWebChromeClient(null);
        webView.setWebViewClient(null);
        webView.destroy();
        super.onDestroy();
    }

    public class WebAppInterface {
        Context mContext;
        WebAppInterface(Context c) { mContext = c; }

        @JavascriptInterface
        public void showNotification(String title, String message) {
            runOnUiThread(() -> sendAndroidNotification(title, message, null));
        }

        @JavascriptInterface
        public void showNotificationWithUrl(String title, String message, String targetUrl) {
            runOnUiThread(() -> sendAndroidNotification(title, message, targetUrl));
        }

        @JavascriptInterface
        public void requestPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 304);
                }
            }
        }
    }

    private void sendAndroidNotification(String title, String message, String targetUrl) {
        try {
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            String channelId = "kynisto_high_priority_v3";
            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            long[] doublePulseVibration = new long[]{0, 150, 100, 150, 100, 250};

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                    channelId,
                    "Kynisto Alerts & Orders",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("High priority order, queue, and system alerts with sound");
                channel.enableVibration(true);
                channel.setVibrationPattern(doublePulseVibration);
                
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build();
                channel.setSound(defaultSoundUri, audioAttributes);

                if (notificationManager != null) {
                    notificationManager.createNotificationChannel(channel);
                }
            }

            Intent intent = new Intent(this, MainActivity.class);
            if (targetUrl != null && !targetUrl.trim().isEmpty()) {
                intent.putExtra("target_url", targetUrl.trim());
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(
                this, (int) System.currentTimeMillis(), intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setSound(defaultSoundUri)
                .setVibrate(doublePulseVibration)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

            if (notificationManager != null) {
                notificationManager.notify((int) System.currentTimeMillis(), builder.build());
            }
        } catch (Exception e) {
            Toast.makeText(this, title + ": " + message, Toast.LENGTH_SHORT).show();
        }
    }

    private static final class PendingDownload {
        final String url;
        final String userAgent;
        final String contentDisposition;
        final String mimeType;
        PendingDownload(String url, String userAgent, String contentDisposition, String mimeType) {
            this.url = url;
            this.userAgent = userAgent;
            this.contentDisposition = contentDisposition;
            this.mimeType = mimeType == null ? MimeTypeMap.getFileExtensionFromUrl(url) : mimeType;
        }
    }
}
