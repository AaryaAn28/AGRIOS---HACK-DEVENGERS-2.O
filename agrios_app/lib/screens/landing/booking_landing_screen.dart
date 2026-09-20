import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../auth/login_screen.dart';

class BookingLandingScreen extends StatefulWidget {
  const BookingLandingScreen({super.key});

  static const String bookingUrl = 'https://theagrios.framer.website/#booking';

  @override
  State<BookingLandingScreen> createState() => _BookingLandingScreenState();
}

class _BookingLandingScreenState extends State<BookingLandingScreen> {
  late final WebViewController _webViewController;
  bool _isLoading = true;
  int _loadingProgress = 0;
  bool _hasError = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _navigateToLogin() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const LoginScreen(),
      ),
    );
  }

  void _initializeWebView() {
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(AppColors.background)
      ..addJavaScriptChannel(
        'AgriosBridge',
        onMessageReceived: (JavaScriptMessage message) {
          if (message.message == 'register' ||
              message.message == 'login' ||
              message.message.toLowerCase().contains('register')) {
            _navigateToLogin();
          }
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (mounted) {
              setState(() {
                _loadingProgress = progress;
                if (progress >= 100) {
                  _isLoading = false;
                }
              });
            }
          },
          onPageStarted: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = true;
                _hasError = false;
              });
            }
          },
          onPageFinished: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
            // Inject click listeners on Framer page for any Register/Sign up/Login buttons
            _injectRegisterListener();
          },
          onWebResourceError: (WebResourceError error) {
            // Only set error if main frame failed
            if (error.isForMainFrame ?? true) {
              if (mounted) {
                setState(() {
                  _hasError = true;
                  _isLoading = false;
                  _errorMessage = error.description;
                });
              }
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            final lowerUrl = request.url.toLowerCase();
            if (lowerUrl.contains('#register') ||
                lowerUrl.contains('/register') ||
                lowerUrl.contains('/signup') ||
                lowerUrl.contains('/login') ||
                lowerUrl.contains('app-login')) {
              _navigateToLogin();
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(BookingLandingScreen.bookingUrl));
  }

  void _injectRegisterListener() {
    const script = '''
      (function() {
        function attachRegisterHooks() {
          var elements = document.querySelectorAll('a, button, div, span');
          elements.forEach(function(el) {
            var text = (el.innerText || el.textContent || '').trim().toLowerCase();
            var href = (el.getAttribute('href') || '').toLowerCase();
            if (text === 'register' || text === 'sign in' || text === 'login' ||
                text.includes('register now') || href.includes('register') || href.includes('login')) {
              el.style.cursor = 'pointer';
              el.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (window.AgriosBridge) {
                  window.AgriosBridge.postMessage('register');
                }
              }, true);
            }
          });
        }
        attachRegisterHooks();
        setInterval(attachRegisterHooks, 2000);
      })();
    ''';
    _webViewController.runJavaScript(script);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 1,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('🌿', style: TextStyle(fontSize: 18)),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'AGRIOS',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'Official Booking & Services Portal',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.white.withOpacity(0.85),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12.0),
            child: ElevatedButton.icon(
              onPressed: _navigateToLogin,
              icon: const Icon(Icons.app_registration, size: 16, color: AppColors.primary),
              label: const Text(
                'Register',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                  color: AppColors.primary,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                elevation: 2,
              ),
            ),
          ),
        ],
        bottom: _isLoading
            ? PreferredSize(
                preferredSize: const Size.fromHeight(3.0),
                child: LinearProgressIndicator(
                  value: _loadingProgress > 0 ? _loadingProgress / 100.0 : null,
                  backgroundColor: AppColors.primaryLight.withOpacity(0.3),
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                  minHeight: 3.0,
                ),
              )
            : null,
      ),
      body: Stack(
        children: [
          // Main WebView or Offline Fallback
          if (!_hasError)
            WebViewWidget(controller: _webViewController)
          else
            _buildOfflineFallback(),

          // Bottom Quick Register & Access Banner
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: Material(
              elevation: 8,
              borderRadius: BorderRadius.circular(16),
              color: Colors.white,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primary.withOpacity(0.2), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryDark.withOpacity(0.12),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppColors.success,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'AGRIOS Precision OS',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primaryDark,
                                  letterSpacing: 0.3,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Enter your terminal & access services',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: _navigateToLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        elevation: 2,
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Register',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                            ),
                          ),
                          SizedBox(width: 6),
                          Icon(Icons.arrow_forward, size: 16),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOfflineFallback() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.primaryContainer,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.spa_rounded,
                size: 64,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'AGRIOS Precision Services',
              style: AppTextStyles.h1,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'Book drone spraying, automated soil diagnostics, certified harvesters, and agronomist consultations directly.',
              style: AppTextStyles.body,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: AppColors.cardBorder),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    _buildServiceItem(
                      icon: Icons.electric_bolt,
                      title: 'Autonomous Drone Spraying',
                      price: '₹350 / acre',
                      badge: 'Instant Dispatch',
                    ),
                    const Divider(height: 20),
                    _buildServiceItem(
                      icon: Icons.biotech,
                      title: 'Digital Soil & Microbial Analysis',
                      price: '₹500 / sample',
                      badge: 'AI Lab Tested',
                    ),
                    const Divider(height: 20),
                    _buildServiceItem(
                      icon: Icons.agriculture,
                      title: 'Smart Harvester Fleet Booking',
                      price: '₹1,200 / hr',
                      badge: 'GPS Tracked',
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                OutlinedButton.icon(
                  onPressed: () {
                    setState(() {
                      _isLoading = true;
                      _hasError = false;
                    });
                    _webViewController.reload();
                  },
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text('Retry Website'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: _navigateToLogin,
                  icon: const Icon(Icons.login, size: 18),
                  label: const Text('Register / Sign In'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 80), // bottom bar spacing
          ],
        ),
      ),
    );
  }

  Widget _buildServiceItem({
    required IconData icon,
    required String title,
    required String price,
    required String badge,
  }) {
    return Row(
      children: [
        CircleAvatar(
          backgroundColor: AppColors.primaryContainer,
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppTextStyles.bodyBold),
              Text(price, style: AppTextStyles.caption.copyWith(color: AppColors.primaryDark)),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.successContainer,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            badge,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: AppColors.success,
            ),
          ),
        ),
      ],
    );
  }
}
