import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';

class DisasterDirectivesScreen extends StatefulWidget {
  const DisasterDirectivesScreen({super.key});

  @override
  State<DisasterDirectivesScreen> createState() => _DisasterDirectivesScreenState();
}

class _DisasterDirectivesScreenState extends State<DisasterDirectivesScreen> {
  final List<Map<String, dynamic>> _directives = [
    {
      'title': 'Mandatory Stubble Management Subsidy',
      'order': 'Gazette Notification No. PB/AGRI/2023-45',
      'date': '2023-10-15',
      'status': 'Active',
    },
    {
      'title': 'Flood Inundation Compensation',
      'order': 'Disaster Relief Order No. 892',
      'date': '2023-08-02',
      'status': 'Active',
    },
    {
      'title': 'Immediate Yellow Rust Quarantine',
      'order': 'DIPA 1914 Sec 4',
      'date': '2023-11-20',
      'status': 'Enforced',
    },
  ];

  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _orderNoController = TextEditingController();
  final _signatoryController = TextEditingController();

  void _issueDirective() {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _directives.insert(0, {
          'title': _titleController.text,
          'order': _orderNoController.text,
          'date': DateTime.now().toString().substring(0, 10),
          'status': 'Active',
        });
      });
      _titleController.clear();
      _orderNoController.clear();
      _signatoryController.clear();
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('New Gazette Directive Issued.')),
      );
    }
  }

  void _showIssueForm() {
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
                const Text('Issue New Gazette Directive', style: AppTextStyles.h2),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _titleController,
                  decoration: const InputDecoration(
                    labelText: 'Directive Title',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _orderNoController,
                  decoration: const InputDecoration(
                    labelText: 'Legal Order Numbering',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _signatoryController,
                  decoration: const InputDecoration(
                    labelText: 'Official Signatory Details',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: CustomButton(
                    text: 'Publish Directive',
                    variant: ButtonVariant.danger,
                    onPressed: _issueDirective,
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(
        title: 'Disaster Directives',
        subtitle: 'Emergency Agricultural Orders & Gazette',
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _directives.length,
        itemBuilder: (context, index) {
          final directive = _directives[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(directive['title'], style: AppTextStyles.h3),
                      ),
                      const SizedBox(width: 8),
                      StatusBadge(
                        text: directive['status'],
                        type: directive['status'] == 'Enforced' ? BadgeType.danger : BadgeType.success,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(directive['order'], style: AppTextStyles.code),
                  const SizedBox(height: 4),
                  Text('Issued on: ${directive['date']}', style: AppTextStyles.caption),
                ],
              ),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showIssueForm,
        backgroundColor: AppColors.danger,
        icon: const Icon(Icons.gavel, color: Colors.white),
        label: const Text('Issue Directive', style: TextStyle(color: Colors.white)),
      ),
    );
  }
}
