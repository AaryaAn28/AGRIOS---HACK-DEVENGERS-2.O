import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_text_styles.dart';

enum ButtonVariant { primary, secondary, danger, outline }

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final ButtonVariant variant;
  final Widget? icon;
  final bool isLoading;
  final double? width;
  final double height;

  const CustomButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.variant = ButtonVariant.primary,
    this.icon,
    this.isLoading = false,
    this.width,
    this.height = 46,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    BorderSide border;

    switch (variant) {
      case ButtonVariant.primary:
        bg = AppColors.primary;
        fg = Colors.white;
        border = BorderSide.none;
        break;
      case ButtonVariant.secondary:
        bg = AppColors.surface;
        fg = AppColors.textPrimary;
        border = const BorderSide(color: AppColors.cardBorder, width: 1);
        break;
      case ButtonVariant.danger:
        bg = AppColors.danger;
        fg = Colors.white;
        border = BorderSide.none;
        break;
      case ButtonVariant.outline:
        bg = Colors.transparent;
        fg = AppColors.primary;
        border = const BorderSide(color: AppColors.primary, width: 1.5);
        break;
    }

    return SizedBox(
      width: width,
      height: height,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: fg,
          elevation: variant == ButtonVariant.primary ? 1.5 : 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: border,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        onPressed: isLoading ? null : onPressed,
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    icon!,
                    const SizedBox(width: 8),
                  ],
                  Text(
                    text,
                    style: AppTextStyles.button.copyWith(color: fg),
                  ),
                ],
              ),
      ),
    );
  }
}
