import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_text_styles.dart';

class QuickPersonaCard extends StatelessWidget {
  final Map<String, dynamic> persona;
  final VoidCallback onTap;

  const QuickPersonaCard({
    super.key,
    required this.persona,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Color accentColor;
    switch (persona['role']) {
      case 'agronomist':
        accentColor = AppColors.roleAgronomist;
        break;
      case 'government':
        accentColor = AppColors.roleGovernment;
        break;
      case 'farmer':
        accentColor = AppColors.roleFarmer;
        break;
      case 'worker':
      default:
        accentColor = AppColors.roleOperator;
        break;
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.cardBorder),
            boxShadow: AppColors.softShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: accentColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      persona['avatar'] ?? '👤',
                      style: const TextStyle(fontSize: 20),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          persona['name'] ?? 'User',
                          style: AppTextStyles.bodyBold.copyWith(fontSize: 13.5),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          persona['roleTitle'] ?? 'Cadre',
                          style: AppTextStyles.caption.copyWith(
                            color: accentColor,
                            fontWeight: FontWeight.w700,
                            fontSize: 11,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                persona['description'] ?? '',
                style: AppTextStyles.caption.copyWith(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                  height: 1.25,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 6),
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: accentColor.withOpacity(0.3)),
                ),
                alignment: Alignment.center,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      '1-Tap Demo Login',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: accentColor,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward,
                      size: 13,
                      color: accentColor,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
