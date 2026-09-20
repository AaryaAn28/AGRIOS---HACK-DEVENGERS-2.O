import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';

class PrescriptionFormulatorScreen extends StatefulWidget {
  const PrescriptionFormulatorScreen({super.key});

  @override
  State<PrescriptionFormulatorScreen> createState() => _PrescriptionFormulatorScreenState();
}

class _PrescriptionFormulatorScreenState extends State<PrescriptionFormulatorScreen> {
  final targetController = TextEditingController();
  String selectedChemical = 'Tilt 25% EC Propiconazole';
  String selectedBio = 'Pseudomonas fluorescens';
  double waterVolume = 150;
  double pressure = 40;

  void _dispense() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Prescription dispatched to Field Sprayers!')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(title: 'Spray Prescription Formulator', subtitle: 'Chemical & Biological'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Target Pest / Crop Input', style: AppTextStyles.h2),
            const SizedBox(height: 8),
            TextField(
              controller: targetController,
              decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'e.g., Yellow Rust on Wheat'),
            ),
            const SizedBox(height: 16),
            const Text('Chemical Component', style: AppTextStyles.h2),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: selectedChemical,
              items: ['Tilt 25% EC Propiconazole', 'Cartap Hydrochloride']
                  .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                  .toList(),
              onChanged: (v) => setState(() => selectedChemical = v!),
              decoration: const InputDecoration(border: OutlineInputBorder()),
            ),
            const SizedBox(height: 8),
            const Text('Dosage: 200ml/Acre | Withholding: 30 Days', style: AppTextStyles.caption),
            const SizedBox(height: 16),
            const Text('Biological Component', style: AppTextStyles.h2),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: selectedBio,
              items: ['Pseudomonas fluorescens', 'Trichoderma viride']
                  .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                  .toList(),
              onChanged: (v) => setState(() => selectedBio = v!),
              decoration: const InputDecoration(border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            const Text('Calibration', style: AppTextStyles.h2),
            const SizedBox(height: 8),
            Text('Water Volume: ${waterVolume.toInt()} L/Acre', style: AppTextStyles.body),
            Slider(value: waterVolume, min: 100, max: 200, onChanged: (v) => setState(() => waterVolume = v)),
            Text('Knapsack Nozzle Pressure: ${pressure.toInt()} psi', style: AppTextStyles.body),
            Slider(value: pressure, min: 20, max: 60, onChanged: (v) => setState(() => pressure = v)),
            const SizedBox(height: 24),
            CustomButton(text: 'Dispense & Dispatch to Field Sprayers', onPressed: _dispense, width: double.infinity),
          ],
        ),
      ),
    );
  }
}
