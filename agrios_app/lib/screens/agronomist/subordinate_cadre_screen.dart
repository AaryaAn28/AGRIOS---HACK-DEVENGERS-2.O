import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/status_badge.dart';

class SubordinateCadreScreen extends StatefulWidget {
  const SubordinateCadreScreen({super.key});

  @override
  State<SubordinateCadreScreen> createState() => _SubordinateCadreScreenState();
}

class _SubordinateCadreScreenState extends State<SubordinateCadreScreen> {
  final workers = [
    {'name': 'Sunita Devi', 'farms': 12, 'battery': '85%', 'status': 'Active'},
    {'name': 'Gurpreet Singh', 'farms': 8, 'battery': '40%', 'status': 'Active'},
    {'name': 'Manjit Kaur', 'farms': 15, 'battery': '15%', 'status': 'Low Battery'},
  ];

  void _reassign(int index) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Assign Parcel to ${workers[index]['name']}'),
        content: const TextField(decoration: InputDecoration(hintText: 'Enter Parcel ID')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          CustomButton(
            text: 'Assign',
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Parcel assigned!')));
            },
          ),
        ],
      ),
    );
  }

  void _registerNew() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Register New Field Specialist'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(decoration: InputDecoration(hintText: 'Full Name')),
            SizedBox(height: 8),
            TextField(decoration: InputDecoration(hintText: 'Phone Number')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          CustomButton(
            text: 'Register',
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Specialist Registered!')));
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(title: 'Extension Worker Cadre Roster', subtitle: 'Farm Assignments'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: workers.length,
        itemBuilder: (ctx, i) {
          final w = workers[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: const CircleAvatar(child: Icon(Icons.person)),
              title: Text(w['name'] as String, style: AppTextStyles.bodyBold),
              subtitle: Text('Active Farms: ${w['farms']} | Battery: ${w['battery']}'),
              trailing: StatusBadge(
                text: w['status'] as String,
                type: w['status'] == 'Active' ? BadgeType.success : BadgeType.warning,
              ),
              onTap: () => _reassign(i),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _registerNew,
        icon: const Icon(Icons.add),
        label: const Text('Register Specialist'),
      ),
    );
  }
}
