import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../constants/static_content.dart';
import '../../services/auth_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/language_selector.dart';
import '../../widgets/quick_persona_card.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isOperatorMode = true;
  bool _obscurePassword = true;
  final _emailController = TextEditingController(text: 'worker@agrios.in');
  final _passwordController = TextEditingController(text: 'krishisakhi2026');
  String _selectedRole = 'worker';
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleOperatorLogin() {
    setState(() => _isLoading = true);
    AuthService().loginAsOperator();
  }

  void _handleStandardLogin() async {
    setState(() => _isLoading = true);
    await AuthService().loginWithCredentials(
      email: _emailController.text.trim(),
      password: _passwordController.text,
      role: _selectedRole,
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthService();
    final lang = auth.activeLanguage;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Top Bar: Seal & Language Selector
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        alignment: Alignment.center,
                        child: const Text('🌾', style: TextStyle(fontSize: 18)),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'AGRIOS',
                        style: AppTextStyles.h2.copyWith(
                          fontSize: 18,
                          color: AppColors.primaryDark,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: const LanguageSelector(),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Punjab Government Letterhead Banner
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.primaryContainer,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.primaryBorder),
                ),
                child: Column(
                  children: [
                    Text(
                      StaticContent.govHeader,
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.primaryDark,
                        fontWeight: FontWeight.w800,
                        fontSize: 9.5,
                        letterSpacing: 0.2,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      StaticContent.icarHeader,
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.primary,
                        fontSize: 8.5,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Title & Subtitle
              Text(
                StaticContent.t('login_title', lang),
                style: AppTextStyles.h1.copyWith(fontSize: 22),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                StaticContent.appTagline,
                style: AppTextStyles.caption.copyWith(fontSize: 12),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),

              // Operator Toggle vs Standard Login
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppColors.cardSubtle,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _isOperatorMode = true;
                            _selectedRole = 'worker';
                            _emailController.text = 'worker@agrios.in';
                            _passwordController.text = 'krishisakhi2026';
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: _isOperatorMode ? AppColors.surface : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: _isOperatorMode ? AppColors.softShadow : null,
                          ),
                          alignment: Alignment.center,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text('👩‍🌾 ', style: TextStyle(fontSize: 14)),
                              Text(
                                'Login as Operator',
                                style: AppTextStyles.bodyBold.copyWith(
                                  fontSize: 12.5,
                                  color: _isOperatorMode ? AppColors.primaryDark : AppColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _isOperatorMode = false;
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: !_isOperatorMode ? AppColors.surface : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: !_isOperatorMode ? AppColors.softShadow : null,
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            'Standard Login',
                            style: AppTextStyles.bodyBold.copyWith(
                              fontSize: 12.5,
                              color: !_isOperatorMode ? AppColors.primaryDark : AppColors.textMuted,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Login Card Body
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: _isOperatorMode ? AppColors.primaryBorder : AppColors.cardBorder,
                    width: _isOperatorMode ? 1.5 : 1.0,
                  ),
                  boxShadow: AppColors.softShadow,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_isOperatorMode) ...[
                      // Operator Highlight Banner
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.primaryContainer,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.primaryBorder),
                        ),
                        child: Row(
                          children: [
                            const Text('👩‍🌾', style: TextStyle(fontSize: 24)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Krishi Sakhi Extension Cadre',
                                    style: AppTextStyles.bodyBold.copyWith(
                                      color: AppColors.primaryDark,
                                      fontSize: 13,
                                    ),
                                  ),
                                  Text(
                                    'Pre-loaded: Sunita Devi (WORKER-001)',
                                    style: AppTextStyles.caption.copyWith(
                                      color: AppColors.primary,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],

                    // Email / ID Field
                    Text(
                      StaticContent.t('email_label', lang),
                      style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _emailController,
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: AppColors.cardBorder),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                        ),
                        prefixIcon: const Icon(Icons.badge_outlined, size: 18, color: AppColors.textMuted),
                      ),
                      style: AppTextStyles.body,
                    ),
                    const SizedBox(height: 12),

                    // Password Field
                    Text(
                      StaticContent.t('password_label', lang),
                      style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: AppColors.cardBorder),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                        ),
                        prefixIcon: const Icon(Icons.lock_outline, size: 18, color: AppColors.textMuted),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? Icons.visibility_off : Icons.visibility,
                            size: 18,
                            color: AppColors.textMuted,
                          ),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                      ),
                      style: AppTextStyles.body,
                    ),
                    const SizedBox(height: 14),

                    // Role Selector if standard login
                    if (!_isOperatorMode) ...[
                      Text(
                        'Select Operational Role',
                        style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        value: _selectedRole,
                        decoration: InputDecoration(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: const BorderSide(color: AppColors.cardBorder),
                          ),
                        ),
                        items: const [
                          DropdownMenuItem(value: 'worker', child: Text('Krishi Sakhi (Field Operator)')),
                          DropdownMenuItem(value: 'agronomist', child: Text('Dr. Priya Sharma (Agronomist)')),
                          DropdownMenuItem(value: 'farmer', child: Text('Balwinder Singh (Farmer)')),
                          DropdownMenuItem(value: 'government', child: Text('Dr. Vikramaditya Sen (Government)')),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedRole = val);
                        },
                      ),
                      const SizedBox(height: 14),
                    ],

                    // Sign In Button
                    CustomButton(
                      text: _isOperatorMode
                          ? 'Enter as Krishi Sakhi Operator'
                          : StaticContent.t('sign_in_btn', lang),
                      icon: const Icon(Icons.login, size: 18, color: Colors.white),
                      isLoading: _isLoading,
                      onPressed: _isOperatorMode ? _handleOperatorLogin : _handleStandardLogin,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // 4 Quick Demo Logins Header
              Row(
                children: [
                  const Text('⚡ ', style: TextStyle(fontSize: 16)),
                  Text(
                    StaticContent.t('quick_demo_title', lang),
                    style: AppTextStyles.h3.copyWith(fontSize: 14),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // 4 Quick Demo Personas Grid
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 0.95,
                ),
                itemCount: StaticContent.quickDemoPersonas.length,
                itemBuilder: (context, index) {
                  final persona = StaticContent.quickDemoPersonas[index];
                  return QuickPersonaCard(
                    persona: persona,
                    onTap: () => auth.loginAsPersona(persona),
                  );
                },
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
