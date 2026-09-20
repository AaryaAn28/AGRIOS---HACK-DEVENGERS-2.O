import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_text_styles.dart';
import '../services/auth_service.dart';
import '../screens/help/help_guide_screen.dart';
import 'language_selector.dart';
import '../main.dart';

class CommonAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final String? subtitle;
  final bool showBack;
  final List<Widget>? actions;

  const CommonAppBar({
    super.key,
    required this.title,
    this.subtitle,
    this.showBack = true,
    this.actions,
  });

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: AppColors.primary,
      elevation: 0,
      leading: showBack
          ? IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
              onPressed: () => Navigator.of(context).maybePop(),
            )
          : null,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            title,
            style: AppTextStyles.h3.copyWith(color: Colors.white, fontSize: 16),
          ),
          if (subtitle != null)
            Text(
              subtitle!,
              style: AppTextStyles.caption.copyWith(
                color: Colors.white.withOpacity(0.85),
                fontSize: 10.5,
              ),
            ),
        ],
      ),
      actions: [
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 12),
          child: LanguageSelector(),
        ),
        IconButton(
          icon: const Icon(Icons.help_outline, color: Colors.white, size: 20),
          tooltip: 'Help & SOP Guide',
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const HelpGuideScreen()),
            );
          },
        ),
        if (actions != null) ...actions!,
        IconButton(
          icon: const Icon(Icons.logout, color: Colors.white, size: 20),
          tooltip: 'Sign Out',
          onPressed: () {
            AuthService().logout();
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const AuthGate()),
              (route) => false,
            );
          },
        ),
        const SizedBox(width: 4),
      ],
    );
  }
}
