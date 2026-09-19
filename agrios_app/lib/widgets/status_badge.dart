import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_text_styles.dart';

enum BadgeType { success, warning, danger, info, neutral }

class StatusBadge extends StatelessWidget {
  final String text;
  final BadgeType type;

  const StatusBadge({
    super.key,
    required this.text,
    this.type = BadgeType.neutral,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    Color border;

    switch (type) {
      case BadgeType.success:
        bg = AppColors.successBg;
        fg = AppColors.success;
        border = AppColors.primaryBorder;
        break;
      case BadgeType.warning:
        bg = AppColors.warningBg;
        fg = AppColors.warning;
        border = const Color(0xFFFDE68A);
        break;
      case BadgeType.danger:
        bg = AppColors.dangerBg;
        fg = AppColors.danger;
        border = const Color(0xFFFECACA);
        break;
      case BadgeType.info:
        bg = AppColors.infoBg;
        fg = AppColors.info;
        border = const Color(0xFFBAE6FD);
        break;
      case BadgeType.neutral:
        bg = AppColors.cardSubtle;
        fg = AppColors.textMuted;
        border = AppColors.cardBorder;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border, width: 1),
      ),
      child: Text(
        text,
        style: AppTextStyles.badge.copyWith(color: fg),
      ),
    );
  }
}
