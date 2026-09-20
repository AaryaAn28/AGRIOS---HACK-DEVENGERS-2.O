import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';

class PathogenLabScreen extends StatefulWidget {
  const PathogenLabScreen({super.key});

  @override
  State<PathogenLabScreen> createState() => _PathogenLabScreenState();
}

class _PathogenLabScreenState extends State<PathogenLabScreen> {
  final specimens = [
    {'name': 'Puccinia striiformis urediniospores', 'aiScore': 94, 'density': 120, 'scout': 'Krishi Sakhi A'},
    {'name': 'Stem borer egg mass', 'aiScore': 88, 'density': 45, 'scout': 'Krishi Sakhi B'},
    {'name': 'Alternaria conidia', 'aiScore': 76, 'density': 300, 'scout': 'Krishi Sakhi C'},
  ];

  int selectedIdx = 0;

  void _certifyAndIssue() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Lab Diagnosis Certified. Advisory Issued!')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final current = specimens[selectedIdx];
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(title: 'Pathogen AI Diagnostic Lab', subtitle: 'Micro-scouting Review'),
      body: Row(
        children: [
          Expanded(
            flex: 1,
            child: ListView.builder(
              itemCount: specimens.length,
              itemBuilder: (ctx, i) => ListTile(
                title: Text(specimens[i]['name'] as String, style: AppTextStyles.bodyBold),
                subtitle: Text('Scout: ${specimens[i]['scout']}'),
                selected: i == selectedIdx,
                selectedTileColor: AppColors.primaryContainer,
                onTap: () => setState(() => selectedIdx = i),
              ),
            ),
          ),
          const VerticalDivider(width: 1),
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(current['name'] as String, style: AppTextStyles.h1),
                  const SizedBox(height: 16),
                  Container(
                    height: 200,
                    width: double.infinity,
                    color: Colors.black87,
                    child: const Center(
                      child: Text(
                        'High-magnification Microscope View Simulation\n(Image processing active)',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.greenAccent, fontFamily: 'monospace'),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      StatusBadge(text: 'AI Confidence: ${current['aiScore']}%', type: BadgeType.info),
                      StatusBadge(text: 'Spore Density: ${current['density']} / mm²', type: BadgeType.warning),
                    ],
                  ),
                  const Spacer(),
                  CustomButton(
                    text: 'Certify Lab Diagnosis & Issue Advisory',
                    onPressed: _certifyAndIssue,
                    width: double.infinity,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
