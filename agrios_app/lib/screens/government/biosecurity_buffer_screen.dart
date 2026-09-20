import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';

class BiosecurityBufferScreen extends StatefulWidget {
  const BiosecurityBufferScreen({super.key});

  @override
  State<BiosecurityBufferScreen> createState() => _BiosecurityBufferScreenState();
}

class _BiosecurityBufferScreenState extends State<BiosecurityBufferScreen> {
  final List<Map<String, dynamic>> _cordons = [
    {
      'code': 'LUD-PB-23',
      'order': 'Order 44(A) DIPA 1914',
      'radius': 15,
      'checkpoints': 8,
      'status': 'Enforced',
    },
    {
      'code': 'BTI-WF-09',
      'order': 'Order 44(B) DIPA 1914',
      'radius': 25,
      'checkpoints': 12,
      'status': 'Monitoring',
    },
    {
      'code': 'SNG-SB-11',
      'order': 'Order 42(C) DIPA 1914',
      'radius': 10,
      'checkpoints': 4,
      'status': 'Lifted',
    },
  ];

  final _formKey = GlobalKey<FormState>();
  final _pestController = TextEditingController();
  final _basinController = TextEditingController();
  final _chemicalController = TextEditingController();

  void _declareNewCordon() {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _cordons.insert(0, {
          'code': 'NEW-ZN-01',
          'order': 'Order 45(A) DIPA 1914',
          'radius': 20,
          'checkpoints': 6,
          'status': 'Enforced',
        });
      });
      _pestController.clear();
      _basinController.clear();
      _chemicalController.clear();
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('New containment cordon declared.')),
      );
    }
  }

  void _showDeclareCordonForm() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 16,
            right: 16,
            top: 24,
          ),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Declare New Containment Cordon', style: AppTextStyles.h2),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _pestController,
                  decoration: const InputDecoration(
                    labelText: 'Target Pest',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _basinController,
                  decoration: const InputDecoration(
                    labelText: 'Basin / Region',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _chemicalController,
                  decoration: const InputDecoration(
                    labelText: 'Chemical Barrier Agent (e.g. Propiconazole 25% EC)',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: CustomButton(
                    text: 'Submit Declaration',
                    onPressed: _declareNewCordon,
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        );
      },
    );
  }

  void _toggleStatus(int index) {
    setState(() {
      final current = _cordons[index]['status'];
      if (current == 'Enforced') {
        _cordons[index]['status'] = 'Monitoring';
      } else if (current == 'Monitoring') {
        _cordons[index]['status'] = 'Lifted';
      } else {
        _cordons[index]['status'] = 'Enforced';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(
        title: 'Biosecurity Buffer Zones',
        subtitle: 'Cordon Sanitaire Management',
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _cordons.length,
        itemBuilder: (context, index) {
          final cordon = _cordons[index];
          BadgeType type = BadgeType.success;
          if (cordon['status'] == 'Enforced') type = BadgeType.danger;
          if (cordon['status'] == 'Monitoring') type = BadgeType.warning;

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(cordon['code'], style: AppTextStyles.h3),
                      InkWell(
                        onTap: () => _toggleStatus(index),
                        child: StatusBadge(
                          text: cordon['status'],
                          type: type,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('Legal Order: ${cordon['order']}', style: AppTextStyles.bodyBold),
                  const SizedBox(height: 4),
                  Text('Radius: ${cordon['radius']} km | Checkpoints: ${cordon['checkpoints']}', style: AppTextStyles.subtitle),
                ],
              ),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showDeclareCordonForm,
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add_moderator, color: Colors.white),
        label: const Text('Declare Cordon', style: TextStyle(color: Colors.white)),
      ),
    );
  }
}
