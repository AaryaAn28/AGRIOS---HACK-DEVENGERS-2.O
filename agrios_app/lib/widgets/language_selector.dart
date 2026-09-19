import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_text_styles.dart';
import '../services/auth_service.dart';

class LanguageSelector extends StatelessWidget {
  const LanguageSelector({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = AuthService();
    return AnimatedBuilder(
      animation: auth,
      builder: (context, _) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.18),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.white.withOpacity(0.35)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: auth.activeLanguage,
              dropdownColor: AppColors.textPrimary,
              icon: const Icon(Icons.language, color: Colors.white, size: 16),
              style: AppTextStyles.caption.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
              onChanged: (val) {
                if (val != null) auth.setLanguage(val);
              },
              items: const [
                DropdownMenuItem(
                  value: 'en',
                  child: Text('🇬🇧 English', style: TextStyle(color: Colors.white)),
                ),
                DropdownMenuItem(
                  value: 'hi',
                  child: Text('🇮🇳 हिन्दी', style: TextStyle(color: Colors.white)),
                ),
                DropdownMenuItem(
                  value: 'or',
                  child: Text('🇮🇳 ଓଡ଼ିଆ', style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
